import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const COLORS = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#64748b', // Slate
];

export function AddCategoryForm({ onClose, editCategoryId }: { onClose: () => void, editCategoryId?: string }) {
    const { addCategory, updateCategory, categories } = useData();

    // Find existing category if editing
    const existingCategory = editCategoryId ? categories.find(c => c.id === editCategoryId) : null;

    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[5]); // Default blue
    const [nextBillDate, setNextBillDate] = useState('');

    // Pre-fill form if editing
    useEffect(() => {
        if (existingCategory) {
            setName(existingCategory.name);
            setSelectedColor(existingCategory.color);
            // Format ISO string to YYYY-MM-DD for input type="date"
            if (existingCategory.nextBillDate) {
                setNextBillDate(existingCategory.nextBillDate.split('T')[0]);
            }
        }
    }, [existingCategory]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (existingCategory) {
            // Update functionality
            updateCategory(existingCategory.id, {
                name: name.trim(),
                color: selectedColor,
                nextBillDate: nextBillDate ? new Date(nextBillDate).toISOString() : undefined
            });
        } else {
            // Create functionality
            addCategory(name.trim(), selectedColor, nextBillDate ? new Date(nextBillDate).toISOString() : undefined);
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-card text-card-foreground w-full max-w-sm rounded-xl border border-border shadow-xl p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{existingCategory ? 'Edit Category' : 'New Category'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Category Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Amazon Pay ICICI"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-muted/50 border border-input rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">Color Label</label>
                        <div className="flex flex-wrap gap-3">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                                        selectedColor === color ? "border-foreground scale-110 shadow-lg" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Next Bill Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Next Bill/Generation Date (Optional)</label>
                        <input
                            type="date"
                            value={nextBillDate}
                            onChange={(e) => setNextBillDate(e.target.value)}
                            className="w-full bg-muted/50 border border-input rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {existingCategory ? 'Save Changes' : 'Create Category'}
                    </button>
                </form>
            </div>
        </div>
    );
}
