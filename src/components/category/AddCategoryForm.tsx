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
    const { addCategory, updateCategory, mergeCategories, categories } = useData();

    // Find existing category if editing
    const existingCategory = editCategoryId ? categories.find(c => c.id === editCategoryId) : null;
    const otherCategories = categories.filter(c => c.id !== editCategoryId);

    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[5]); // Default blue
    const [nextBillDate, setNextBillDate] = useState('');
    const [group, setGroup] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [mergeTargetId, setMergeTargetId] = useState('');

    // Pre-fill form if editing
    useEffect(() => {
        if (existingCategory) {
            setName(existingCategory.name);
            setSelectedColor(existingCategory.color);
            setGroup(existingCategory.group || '');
            setCardNumber(existingCategory.cardNumber || '');
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
                group: group.trim() || undefined,
                cardNumber: cardNumber.trim() || undefined,
                nextBillDate: nextBillDate ? new Date(nextBillDate).toISOString() : undefined
            });
        } else {
            // Create functionality
            addCategory(name.trim(), selectedColor, group.trim() || undefined, cardNumber.trim() || undefined, nextBillDate ? new Date(nextBillDate).toISOString() : undefined);
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

                    {/* Group Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Group / Bank Name (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. HDFC, OneCard (for grouping)"
                            value={group}
                            onChange={(e) => setGroup(e.target.value)}
                            className="w-full bg-muted/50 border border-input rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                            list="existing-groups"
                        />
                        <datalist id="existing-groups">
                            {Array.from(new Set(categories.map(c => c.group || c.name.split(' ')[0]))).map(g => (
                                <option key={g} value={g} />
                            ))}
                        </datalist>
                    </div>

                    {/* Card Number */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Card Number / Last 4 Digits (Optional)</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            placeholder="e.g. 1234 5678 9012 3456 or Just Last 4"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full bg-muted/50 border border-input rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium font-mono"
                        />
                    </div>

                    {/* Merge into another card option (Only when editing) */}
                    {existingCategory && otherCategories.length > 0 && (
                        <div className="p-3 bg-muted/30 border border-border rounded-xl space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                Merge with Another Card
                            </label>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Move all transactions from <strong>{existingCategory.name}</strong> into another card (e.g. merging dual RuPay / Visa cards that share the same bill).
                            </p>
                            <div className="flex gap-2 pt-1">
                                <select
                                    value={mergeTargetId}
                                    onChange={(e) => setMergeTargetId(e.target.value)}
                                    className="flex-1 bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="">Select target card...</option>
                                    {otherCategories.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    disabled={!mergeTargetId}
                                    onClick={async () => {
                                        const target = otherCategories.find(c => c.id === mergeTargetId);
                                        if (confirm(`Are you sure you want to merge all spends from "${existingCategory.name}" into "${target?.name}"? "${existingCategory.name}" will be deleted.`)) {
                                            await mergeCategories(existingCategory.id, mergeTargetId);
                                            onClose();
                                        }
                                    }}
                                    className="px-3 py-1.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-lg text-xs font-bold hover:bg-orange-500/20 disabled:opacity-40 transition-colors"
                                >
                                    Merge
                                </button>
                            </div>
                        </div>
                    )}

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
