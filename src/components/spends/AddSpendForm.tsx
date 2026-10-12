import { useState, useEffect } from 'react';
import { useData, type Spend } from '../../context/DataContext';
import { X, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format, addMonths, addYears, parseISO, differenceInMonths, differenceInYears } from 'date-fns';

export type InitialSpendData = {
    amount?: number;
    description?: string;
    categoryId?: string;
    dueDate?: string;
};

export function AddSpendForm({ onClose, defaultCategoryId, initialData, editSpend }: { onClose: () => void, defaultCategoryId?: string, initialData?: InitialSpendData, editSpend?: Spend }) {
    const { categories, addSpend, updateSpend } = useData();

    // Helper to format date for input
    const formatDateForInput = (isoString?: string) => {
        if (!isoString) return format(new Date(), 'yyyy-MM-dd');
        return isoString.split('T')[0];
    };

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [dueDate, setDueDate] = useState('');
    const [emiEndDate, setEmiEndDate] = useState('');
    const [durationValue, setDurationValue] = useState('');
    const [isCustomEndDate, setIsCustomEndDate] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFrequency, setRecurringFrequency] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [isPaid, setIsPaid] = useState(false);

    const calculateEndDate = (freq: 'MONTHLY' | 'YEARLY', countStr: string, startDateStr: string) => {
        const count = parseInt(countStr);
        if (!count || isNaN(count) || count <= 0) return '';
        try {
            const baseDate = parseISO(startDateStr);
            const target = freq === 'YEARLY' ? addYears(baseDate, count) : addMonths(baseDate, count);
            return format(target, 'yyyy-MM-dd');
        } catch {
            return '';
        }
    };

    // Initialize state (for both New and Edit modes)
    useEffect(() => {
        if (editSpend) {
            setAmount(editSpend.amount.toString());
            setDescription(editSpend.description);
            setCategoryId(editSpend.categoryId);
            setSubcategory(editSpend.subcategory || '');
            setDate(formatDateForInput(editSpend.date));
            setIsRecurring(editSpend.isRecurring);
            const freq = editSpend.recurringFrequency || 'MONTHLY';
            setRecurringFrequency(freq);
            setDueDate(formatDateForInput(editSpend.dueDate));
            setEmiEndDate(formatDateForInput(editSpend.emiEndDate));
            setIsPaid(editSpend.isPaid);

            if (editSpend.emiEndDate && editSpend.date) {
                try {
                    if (freq === 'YEARLY') {
                        const yrs = differenceInYears(parseISO(editSpend.emiEndDate), parseISO(editSpend.date));
                        setDurationValue(yrs > 0 ? yrs.toString() : '');
                    } else {
                        const mos = differenceInMonths(parseISO(editSpend.emiEndDate), parseISO(editSpend.date));
                        setDurationValue(mos > 0 ? mos.toString() : '');
                    }
                } catch {
                    setDurationValue('');
                }
            } else {
                setDurationValue('');
            }
        } else {
            // New Spend Initialization
            const targetCatId = initialData?.categoryId || defaultCategoryId || categories[0]?.id || '';
            const initialCat = categories.find(c => c.id === targetCatId);
            setAmount(initialData?.amount?.toString() || '');
            setDescription(initialData?.description || '');
            setCategoryId(targetCatId);
            setDate(format(new Date(), 'yyyy-MM-dd'));
            if (initialCat?.nextBillDate) {
                setDueDate(formatDateForInput(initialCat.nextBillDate));
            }
        }
    }, [editSpend, initialData, defaultCategoryId, categories]);

    // When category changes, auto-suggest card's nextBillDate if due date empty
    const handleCategoryChange = (newCatId: string) => {
        setCategoryId(newCatId);
        if (!dueDate) {
            const cat = categories.find(c => c.id === newCatId);
            if (cat?.nextBillDate) {
                setDueDate(formatDateForInput(cat.nextBillDate));
            }
        }
    };


    // Common subcategories/tags - could be dynamic later
    const SUGGESTED_SUBCATEGORIES = [
        'Food', 'Fuel', 'Shopping', 'Groceries', 'Bills',
        'Travel', 'Entertainment', 'Health', 'Education', 'Rent', 'Sutta'
    ];

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !categoryId || !description) {
            alert(`Please fill all fields.`);
            return;
        }

        if (isSubmitting) return; // Prevent double submit
        setIsSubmitting(true);

        try {
            const spendData = {
                amount: parseFloat(amount),
                description,
                categoryId,
                subcategory: subcategory.trim() || undefined,
                date: new Date(date).toISOString(),
                isRecurring,
                recurringFrequency: isRecurring ? recurringFrequency : undefined,
                dueDate: isRecurring && dueDate ? new Date(dueDate).toISOString() : undefined,
                emiEndDate: isRecurring && emiEndDate ? new Date(emiEndDate).toISOString() : undefined,
                isPaid,
            };

            if (editSpend) {
                await updateSpend(editSpend.id, spendData);
            } else {
                await addSpend(spendData);
            }
            onClose();
        } catch (error) {
            console.error("Error saving spend:", error);
            alert("Error saving: " + (error as Error).message);
            setIsSubmitting(false); // Re-enable on error
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-card text-card-foreground w-full max-w-sm rounded-xl border border-border shadow-xl p-6 animate-in fade-in zoom-in duration-200 lg:max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">{editSpend ? 'Edit Spend' : 'Add Spend'}</h2>
                    <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Amount Input */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Amount</label>
                        <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-muted/50 border border-input rounded-lg pl-8 pr-4 py-3 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                autoFocus={!editSpend} // Auto-focus only for new entry
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <input
                            type="text"
                            placeholder="e.g. Dinner at Zomato"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-muted/50 border border-input rounded-lg px-4 py-3 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                        />
                    </div>

                    {/* Category Selection */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Category (Card/Account)</label>
                        {defaultCategoryId && !editSpend ? (
                            <div className="mt-1 p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: categories.find(c => c.id === defaultCategoryId)?.color }}
                                />
                                <span className="font-medium text-primary">
                                    {categories.find(c => c.id === defaultCategoryId)?.name}
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-2 mt-1 max-h-40 overflow-y-auto">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleCategoryChange(cat.id)}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-lg border text-left transition-all",
                                                categoryId === cat.id
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border hover:bg-muted"
                                            )}
                                        >
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                            <span className="truncate text-sm font-medium">{cat.name}</span>
                                        </button>
                                    ))}
                                </div>
                                {categories.length === 0 && <p className="text-destructive text-xs mt-1">Create a category first!</p>}
                            </>
                        )}
                    </div>

                    {/* Subcategory */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Subcategory (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Food, Fuel..."
                            value={subcategory}
                            onChange={(e) => setSubcategory(e.target.value)}
                            className="w-full bg-muted/50 border border-input rounded-lg px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-sm"
                            list="subcategory-suggestions"
                        />
                        {/* Quick Select Chips */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {SUGGESTED_SUBCATEGORIES.map(sub => (
                                <button
                                    key={sub}
                                    type="button"
                                    onClick={() => setSubcategory(sub)}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-xs font-medium border transition-all active:scale-95",
                                        subcategory === sub
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                                    )}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                        <datalist id="subcategory-suggestions">
                            {SUGGESTED_SUBCATEGORIES.map(sub => (
                                <option key={sub} value={sub} />
                            ))}
                        </datalist>
                    </div>

                    {/* Date and Toggles */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-medium text-muted-foreground">Date</label>
                            <div className="relative mt-1">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => {
                                        const newDate = e.target.value;
                                        setDate(newDate);
                                        if (durationValue && !isCustomEndDate) {
                                            setEmiEndDate(calculateEndDate(recurringFrequency, durationValue, newDate));
                                        }
                                    }}
                                    className="w-full bg-muted/50 border border-input rounded-lg px-3 py-2 pl-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-end gap-2">
                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                    className="w-4 h-4 accent-primary rounded"
                                />
                                Recurring
                            </label>
                            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPaid}
                                    onChange={(e) => setIsPaid(e.target.checked)}
                                    className="w-4 h-4 accent-primary rounded"
                                />
                                Mark as Paid
                            </label>
                        </div>
                    </div>

                    {/* Recurring Options */}
                    {isRecurring && (
                        <div className="animate-in fade-in zoom-in slide-in-from-top-2 duration-200 space-y-4 p-4 rounded-xl bg-muted/30 border border-border/60">
                            {/* Frequency and Next Due Date */}
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frequency</label>
                                    <select
                                        value={recurringFrequency}
                                        onChange={(e) => {
                                            const freq = e.target.value as 'MONTHLY' | 'YEARLY';
                                            setRecurringFrequency(freq);
                                            if (!isCustomEndDate) {
                                                setEmiEndDate(calculateEndDate(freq, durationValue, date));
                                            }
                                        }}
                                        className="w-full mt-1.5 bg-background border border-input rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    >
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="YEARLY">Yearly</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Next Due Date (Opt)</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full mt-1.5 bg-background border border-input rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    {categories.find(c => c.id === categoryId)?.nextBillDate && (
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            Card Bill: {format(parseISO(categories.find(c => c.id === categoryId)!.nextBillDate!), 'dd MMM')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Duration (Tenure in Months / Years) */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {recurringFrequency === 'MONTHLY' ? 'Duration (Number of Months / EMIs)' : 'Duration (Number of Years)'}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsCustomEndDate(!isCustomEndDate)}
                                        className="text-[11px] text-primary hover:underline font-medium"
                                    >
                                        {isCustomEndDate ? '← Enter Months/Years' : 'Custom End Date →'}
                                    </button>
                                </div>

                                {!isCustomEndDate ? (
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder={recurringFrequency === 'MONTHLY' ? 'e.g. 6 (or leave empty for ongoing)' : 'e.g. 1 (or leave empty for ongoing)'}
                                                value={durationValue}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setDurationValue(val);
                                                    setEmiEndDate(calculateEndDate(recurringFrequency, val, date));
                                                }}
                                                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                                                {recurringFrequency === 'MONTHLY' ? 'Months' : 'Years'}
                                            </span>
                                        </div>

                                        {/* Quick Tenure Chips */}
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDurationValue('');
                                                    setEmiEndDate('');
                                                }}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-md text-xs font-medium border transition-all active:scale-95",
                                                    durationValue === ''
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                                                )}
                                            >
                                                Ongoing / Subscription
                                            </button>
                                            {(recurringFrequency === 'MONTHLY' ? ['3', '6', '9', '12', '24'] : ['1', '2', '3', '5']).map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => {
                                                        setDurationValue(val);
                                                        setEmiEndDate(calculateEndDate(recurringFrequency, val, date));
                                                    }}
                                                    className={cn(
                                                        "px-2.5 py-1 rounded-md text-xs font-medium border transition-all active:scale-95",
                                                        durationValue === val
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-background text-muted-foreground border-border hover:bg-muted"
                                                    )}
                                                >
                                                    {recurringFrequency === 'MONTHLY' ? `${val} mo` : `${val} yr`}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Computed Summary Preview */}
                                        <div className="p-2.5 rounded-lg bg-background/80 border border-border/80 text-xs flex items-center justify-between mt-2">
                                            <span className="text-muted-foreground">Tenure Summary:</span>
                                            <span className="font-semibold text-foreground">
                                                {durationValue && emiEndDate
                                                    ? `${durationValue} ${recurringFrequency === 'MONTHLY' ? 'Installments' : 'Years'} • Ends ${format(parseISO(emiEndDate), 'dd MMM yyyy')}`
                                                    : 'Ongoing Subscription (No End Date)'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="date"
                                            value={emiEndDate}
                                            onChange={(e) => {
                                                setEmiEndDate(e.target.value);
                                                // calculate duration back if valid
                                                if (e.target.value && date) {
                                                    try {
                                                        if (recurringFrequency === 'YEARLY') {
                                                            const yrs = differenceInYears(parseISO(e.target.value), parseISO(date));
                                                            setDurationValue(yrs > 0 ? yrs.toString() : '');
                                                        } else {
                                                            const mos = differenceInMonths(parseISO(e.target.value), parseISO(date));
                                                            setDurationValue(mos > 0 ? mos.toString() : '');
                                                        }
                                                    } catch {}
                                                }
                                            }}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            placeholder="Leave empty for ongoing"
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-1">Leave empty for ongoing subscriptions (Netflix, etc).</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!amount || !categoryId || isSubmitting}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {editSpend ? 'Updating...' : 'Saving...'}
                            </>
                        ) : (editSpend ? 'Update Spend' : 'Add Spend')}
                    </button>
                </form>
            </div>
        </div>
    );
}
