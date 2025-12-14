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
    addCategory: (name: string, color: string, nextBillDate?: string) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
    deleteCategory: (id: string) => void;
    addSpend: (spend: Omit<Spend, 'id' | 'createdAt'>) => void;
    updateSpend: (id: string, updates: Partial<Spend>) => void;
    deleteSpend: (id: string) => void;
    importData: (data: { categories: Category[], spends: Spend[] }) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    // Initial state from localStorage (for Guest/Initial load)
    const [categories, setCategories] = useState<Category[]>(() => {
        const saved = localStorage.getItem('credtrack_categories');
        return saved ? JSON.parse(saved) : [];
    });

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

    const saveCategories = (newCategories: Category[]) => {
        setCategories(newCategories); // Optimistic Update
        if (user) {
            setDoc(doc(db, 'users', user.uid, 'data', 'categories'), { list: newCategories });
        }
    };

    const saveSpends = (newSpends: Spend[]) => {
        setSpends(newSpends); // Optimistic Update
        if (user) {
            setDoc(doc(db, 'users', user.uid, 'data', 'spends'), { list: newSpends });
        }
    };

    const addCategory = (name: string, color: string, nextBillDate?: string) => {
        const newCategory: Category = {
            id: uuidv4(),
            name,
            color,
            nextBillDate,
            createdAt: new Date().toISOString(),
        };
        saveCategories([...categories, newCategory]);
    };

    const updateCategory = (id: string, updates: Partial<Category>) => {
        saveCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteCategory = (id: string) => {
        saveCategories(categories.filter(c => c.id !== id));
    };

    const addSpend = (spendData: Omit<Spend, 'id' | 'createdAt'>) => {
        const newSpend: Spend = {
            ...spendData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
        };
        saveSpends([...spends, newSpend]);
    };

    const updateSpend = (id: string, updates: Partial<Spend>) => {
        saveSpends(spends.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteSpend = (id: string) => {
        saveSpends(spends.filter(s => s.id !== id));
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

    return (
        <DataContext.Provider value={{ categories, spends, addCategory, updateCategory, deleteCategory, addSpend, updateSpend, deleteSpend, importData }}>
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
