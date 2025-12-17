import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

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
    dueDate?: string;
    emiEndDate?: string;
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
    markAllAsPaid: (categoryId: string) => Promise<void>;
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

    const markAllAsPaid = async (categoryId: string) => {
        const updatedSpends = spends.map(spend => {
            if (spend.categoryId === categoryId && !spend.isPaid) {
                return { ...spend, isPaid: true };
            }
            return spend;
        });
        await saveSpends(updatedSpends);
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
            createdAt: new Date().toISOString(),
        };
        await saveSpends([...spends, newSpend]);
    };

    const updateSpend = async (id: string, updates: Partial<Spend>) => {
        await saveSpends(spends.map(s => s.id === id ? { ...s, ...updates } : s));
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
