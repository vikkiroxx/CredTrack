import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types
export type Category = {
    id: string;
    name: string;
    color: string;
    nextBillDate?: string; // ISO string for next bill/due date
    icon?: string;
    createdAt: string;
};

export type Spend = {
    id: string;
    amount: number;
    description: string;
    date: string; // ISO string
    categoryId: string;
    subcategory?: string;
    isPaid: boolean;
    isRecurring: boolean;
    dueDate?: string;
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
    // Load initial state from localStorage
    const [categories, setCategories] = useState<Category[]>(() => {
        const saved = localStorage.getItem('credtrack_categories');
        return saved ? JSON.parse(saved) : [];
    });

    const [spends, setSpends] = useState<Spend[]>(() => {
        const saved = localStorage.getItem('credtrack_spends');
        return saved ? JSON.parse(saved) : [];
    });

    // Save to localStorage whenever state changes
    useEffect(() => {
        localStorage.setItem('credtrack_categories', JSON.stringify(categories));
    }, [categories]);

    useEffect(() => {
        localStorage.setItem('credtrack_spends', JSON.stringify(spends));
    }, [spends]);

    const addCategory = (name: string, color: string, nextBillDate?: string) => {
        const newCategory: Category = {
            id: uuidv4(),
            name,
            color,
            nextBillDate,
            createdAt: new Date().toISOString(),
        };
        setCategories(prev => [...prev, newCategory]);
    };

    const updateCategory = (id: string, updates: Partial<Category>) => {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteCategory = (id: string) => {
        setCategories(prev => prev.filter(c => c.id !== id));
    };

    const addSpend = (spendData: Omit<Spend, 'id' | 'createdAt'>) => {
        const newSpend: Spend = {
            ...spendData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
        };
        setSpends(prev => [...prev, newSpend]);
    };

    const updateSpend = (id: string, updates: Partial<Spend>) => {
        setSpends(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteSpend = (id: string) => {
        setSpends(prev => prev.filter(s => s.id !== id));
    };

    const importData = (data: { categories: Category[], spends: Spend[] }) => {
        // Basic validation could go here
        if (Array.isArray(data.categories) && Array.isArray(data.spends)) {
            setCategories(data.categories);
            setSpends(data.spends);
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
