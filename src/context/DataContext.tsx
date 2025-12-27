import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { addMonths, addYears, parseISO } from 'date-fns';

// Types
export type Category = {
    id: string;
    name: string;
    color: string;
    group?: string;
    cardNumber?: string;
    nextBillDate?: string;
    icon?: string;
    createdAt: string;
};

export type Spend = {
    id: string;
    amount: number;
    description: string;
    date: string;
    categoryId: string;
    subcategory?: string;
    isPaid: boolean;
    isRecurring: boolean;
    recurringFrequency?: 'MONTHLY' | 'YEARLY';
    dueDate?: string;
    emiEndDate?: string;
    paidDate?: string;
    createdAt: string;
};

type DataContextType = {
    categories: Category[];
    spends: Spend[];
    addCategory: (name: string, color: string, group?: string, cardNumber?: string, nextBillDate?: string) => Promise<void>;
    updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    addSpend: (spend: Omit<Spend, 'id' | 'createdAt'>) => Promise<void>;
    updateSpend: (id: string, updates: Partial<Spend>) => Promise<void>;
    deleteSpend: (id: string) => Promise<void>;
    markAllAsPaid: (categoryId: string, customPaidAmount?: number) => Promise<void>;
    importData: (data: { categories: Category[], spends: Spend[] }) => void;
    clearAllData: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    // Initial state from localStorage (for Guest/Initial load)
    const [categories, setCategories] = useState<Category[]>(() => {
        const saved = localStorage.getItem('credtrack_categories');
        return saved ? JSON.parse(saved) : [];
    });

    // ... (existing code) ...



    const [spends, setSpends] = useState<Spend[]>(() => {
        const saved = localStorage.getItem('credtrack_spends');
        return saved ? JSON.parse(saved) : [];
    });

    // Sync with Firestore if User is logged in
    useEffect(() => {
        if (!user) {
            // Fallback to localStorage logic is handled by other effects, 
            // but we might want to clear state if switching from User -> Guest (Logout)
            // For now, let's keep the local state persists.
            return;
        }

        const catRef = doc(db, 'users', user.uid, 'data', 'categories');
        const spendRef = doc(db, 'users', user.uid, 'data', 'spends');

        const unsubscribeCat = onSnapshot(catRef, (doc) => {
            if (doc.exists()) {
                setCategories(doc.data().list || []);
            } else {
                // First time login? Sync local data to cloud?
                // For simplicity, if cloud is empty, we push local data.
                if (categories.length > 0) {
                    setDoc(catRef, { list: categories }, { merge: true });
                }
            }
        });

        const unsubscribeSpend = onSnapshot(spendRef, (doc) => {
            if (doc.exists()) {
                setSpends(doc.data().list || []);
            } else {
                if (spends.length > 0) {
                    setDoc(spendRef, { list: spends }, { merge: true });
                }
            }
        });

        return () => {
            unsubscribeCat();
            unsubscribeSpend();
        };
    }, [user]);

    // Sync to LocalStorage (Always backup locally for redundancy or guest mode)
    useEffect(() => {
        localStorage.setItem('credtrack_categories', JSON.stringify(categories));
    }, [categories]);

    useEffect(() => {
        localStorage.setItem('credtrack_spends', JSON.stringify(spends));
    }, [spends]);

    // --- Actions ---

    // --- Actions ---

    const sanitizeForFirestore = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
        return Object.entries(obj).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = sanitizeForFirestore(value);
            }
            return acc;
        }, {} as any);
    };

    const saveCategories = async (newCategories: Category[]) => {
        setCategories(newCategories); // Optimistic Update
        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid, 'data', 'categories'), { list: sanitizeForFirestore(newCategories) });
            } catch (error) {
                console.error("Error saving categories to cloud:", error);
                throw error; // Rethrow to notify UI
            }
        }
    };

    const saveSpends = async (newSpends: Spend[]) => {
        setSpends(newSpends); // Optimistic Update
        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid, 'data', 'spends'), { list: sanitizeForFirestore(newSpends) });
            } catch (error) {
                console.error("Error saving spends to cloud:", error);
                throw error; // Rethrow to notify UI
            }
        }
    };

    // Helper to generate next recurring spend
    const createNextSpend = (current: Spend): Spend => {
        const frequency = current.recurringFrequency || 'MONTHLY';
        const nextDate = frequency === 'YEARLY'
            ? addYears(parseISO(current.date), 1)
            : addMonths(parseISO(current.date), 1);

        // If there's a specific due date, shift that too
        const nextDueDate = current.dueDate
            ? (frequency === 'YEARLY' ? addYears(parseISO(current.dueDate), 1) : addMonths(parseISO(current.dueDate), 1)).toISOString()
            : undefined;

        // Check if we passed the end date
        if (current.emiEndDate) {
            const endDate = parseISO(current.emiEndDate);
            if (nextDate > endDate) {
                return current; // Should ideally return null but type safety, handled by caller
            }
        }

        return {
            ...current,
            id: uuidv4(),
            date: nextDate.toISOString(),
            dueDate: nextDueDate,
            isPaid: false,
            paidDate: undefined,
            createdAt: new Date().toISOString()
        };
    };

    const markAllAsPaid = async (categoryId: string, customPaidAmount?: number) => {
        const newSpends: Spend[] = [];
        const spendsToUpdate = [...spends]; // Clone to find objects
        const unpaidSpends = spendsToUpdate.filter(s => s.categoryId === categoryId && !s.isPaid);

        // Sort by Date ASC (Oldest first) to prioritize clearing backlogs
        unpaidSpends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const totalUnpaid = unpaidSpends.reduce((sum, s) => sum + s.amount, 0);

        // Determine effective payment amount
        let remainingAmount = customPaidAmount !== undefined ? customPaidAmount : totalUnpaid;

        // IDs of spends that get paid in this transaction
        const paidSpendIds = new Set<string>();

        // 1. Waterfall Payment Logic
        for (const spend of unpaidSpends) {
            if (remainingAmount <= 0.01) break; // Stop if money runs out

            // If we can afford this spend (or if it's the standard "Pay All" case)
            if (customPaidAmount === undefined || spend.amount <= remainingAmount + 0.01) {
                paidSpendIds.add(spend.id);
                remainingAmount -= spend.amount;

                // Handle Recurring Logic
                if (spend.isRecurring) {
                    const nextSpend = createNextSpend(spend);
                    if (nextSpend.id !== spend.id) {
                        newSpends.push(nextSpend);
                    }
                }
            } else {
                // Spend too big for remaining amount. Skip.
            }
        }

        // 2. Handle Adjustment / Partial Credit
        if (customPaidAmount !== undefined && Math.abs(remainingAmount) > 0.01) {
            const hasUnpaidLeft = unpaidSpends.some(s => !paidSpendIds.has(s.id));

            newSpends.push({
                id: uuidv4(),
                amount: -remainingAmount, // Negative amount
                description: hasUnpaidLeft ? 'Partial Payment / Credit' : 'Bill Adjustment / Fees',
                date: new Date().toISOString(),
                categoryId,
                isPaid: !hasUnpaidLeft, // Paid if cleared everything, Unpaid (Credit) if debt remains
                paidDate: !hasUnpaidLeft ? undefined : new Date().toISOString(),
                isRecurring: false,
                createdAt: new Date().toISOString()
            });
        }

        // 3. Apply Updates
        const updatedSpends = spendsToUpdate.map(spend => {
            if (paidSpendIds.has(spend.id)) {
                return { ...spend, isPaid: true, paidDate: new Date().toISOString() };
            }
            return spend;
        });

        // 4. Update Category Next Bill Date
        // Only if a recurring spend was INCLUDED in the paid set
        const category = categories.find(c => c.id === categoryId);
        const recurringWasPaid = unpaidSpends.some(s => s.isRecurring && paidSpendIds.has(s.id));

        if (category && category.nextBillDate && recurringWasPaid) {
            const nextBillDate = addMonths(parseISO(category.nextBillDate), 1).toISOString();
            await updateCategory(categoryId, { nextBillDate });
        }

        await saveSpends([...updatedSpends, ...newSpends]);
    };

    const addCategory = async (name: string, color: string, group?: string, cardNumber?: string, nextBillDate?: string) => {
        const newCategory: Category = {
            id: uuidv4(),
            name,
            color,
            group,
            cardNumber,
            nextBillDate,
            createdAt: new Date().toISOString(),
        };
        await saveCategories([...categories, newCategory]);
    };

    const updateCategory = async (id: string, updates: Partial<Category>) => {
        await saveCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteCategory = async (id: string) => {
        await saveCategories(categories.filter(c => c.id !== id));
    };

    const addSpend = async (spendData: Omit<Spend, 'id' | 'createdAt'>) => {
        const newSpend: Spend = {
            ...spendData,
            id: uuidv4(),
            paidDate: spendData.isPaid ? new Date().toISOString() : undefined,
            createdAt: new Date().toISOString(),
        };
        await saveSpends([...spends, newSpend]);
    };

    const updateSpend = async (id: string, updates: Partial<Spend>) => {
        const currentSpend = spends.find(s => s.id === id);
        let newGeneratedSpend: Spend | null = null;
        let finalUpdates = { ...updates };

        // Handle Paid Date logic
        if (updates.isPaid === true) {
            finalUpdates.paidDate = new Date().toISOString();
        } else if (updates.isPaid === false) {
            finalUpdates.paidDate = undefined; // Clear it if marked unpaid
        }

        // Auto-Renewal & Category Date Sync Logic
        if (currentSpend && !currentSpend.isPaid && updates.isPaid === true) {
            // 1. Recurring Auto-Renewal
            if (currentSpend.isRecurring) {
                const nextSpend = createNextSpend(currentSpend);
                if (nextSpend.id !== currentSpend.id) {
                    newGeneratedSpend = nextSpend;
                }

                // 2. Sync Category Next Bill Date (Fix for persistence issue)
                const category = categories.find(c => c.id === currentSpend.categoryId);
                if (category && category.nextBillDate) {
                    const nextBillDate = addMonths(parseISO(category.nextBillDate), 1).toISOString();
                    // We can call updateCategory directly here but we need to await it.
                    // Instead of blocking, we'll fire and forget or await it if we want strict consistency.
                    // Given the context, we should update local state via helper or just call the function.
                    // Since updateCategory updates all categories, it's safe.
                    await updateCategory(category.id, { nextBillDate });
                }
            }
        }

        const updatedList = spends.map(s => s.id === id ? { ...s, ...finalUpdates } : s);

        if (newGeneratedSpend) {
            updatedList.push(newGeneratedSpend);
        }

        await saveSpends(updatedList);
    };

    const deleteSpend = async (id: string) => {
        await saveSpends(spends.filter(s => s.id !== id));
    };

    const importData = (data: { categories: Category[], spends: Spend[] }) => {
        if (Array.isArray(data.categories) && Array.isArray(data.spends)) {
            saveCategories(data.categories);
            saveSpends(data.spends);
            alert('Data imported successfully!');
        } else {
            alert('Invalid data format.');
        }
    };

    const clearAllData = async () => {
        // Clear State
        setCategories([]);
        setSpends([]);

        // Clear Local Storage
        localStorage.removeItem('credtrack_categories');
        localStorage.removeItem('credtrack_spends');

        // Clear Firestore (if logged in)
        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid, 'data', 'categories'), { list: [] });
                await setDoc(doc(db, 'users', user.uid, 'data', 'spends'), { list: [] });
            } catch (error) {
                console.error("Error clearing cloud data:", error);
                alert("Failed to clear cloud data. Please try again.");
            }
        }
    };

    return (
        <DataContext.Provider value={{ categories, spends, addCategory, updateCategory, deleteCategory, addSpend, updateSpend, deleteSpend, markAllAsPaid, importData, clearAllData }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
