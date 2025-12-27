import { useState, useMemo } from 'react';
import { AddCategoryForm } from './AddCategoryForm';
import { useData } from '../../context/DataContext';
import { SpendList } from '../spends/SpendList';
import { SubcategoryPieChart } from '../dashboard/SubcategoryPieChart';
import { ArrowLeft, CheckCircle, Pencil } from 'lucide-react';
import { format, differenceInDays, parseISO, isSameMonth } from 'date-fns';
import { cn } from '../../lib/utils';

type CategoryDetailProps = {
    categoryId: string;
    onBack: () => void;
};

export function CategoryDetail({ categoryId, onBack }: CategoryDetailProps) {
    const { categories, spends: allSpends, markAllAsPaid } = useData();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
    const [customPayAmount, setCustomPayAmount] = useState('');

    const category = categories.find(c => c.id === categoryId);

    // Optimize performance by memoizing filtered spends
    const spends = useMemo(() =>
        allSpends.filter(s => s.categoryId === categoryId),
        [allSpends, categoryId]);

    if (!category) return null;

    const daysLeft = category.nextBillDate
        ? differenceInDays(parseISO(category.nextBillDate), new Date())
        : null;

    const today = new Date();

    const totalSpentThisMonth = spends
        .filter(s => isSameMonth(parseISO(s.date), today))
        .reduce((sum, s) => sum + s.amount, 0);

    const pendingBalance = spends
        .filter(s => !s.isPaid)
        .reduce((sum, s) => sum + s.amount, 0);

    return (
        <div className="flex flex-col h-full relative">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            <div>
                                <h2 className="text-xl font-bold leading-none">{category.name}</h2>
                                {category.cardNumber && (
                                    <p className="text-xs text-muted-foreground font-mono mt-1 opacity-80 tracking-wide">
                                        {category.cardNumber}
                                    </p>
                                )}
                            </div>
                            <div className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setIsEditOpen(true)}>
                                <Pencil className="w-3 h-3" />
                            </div>
                        </div>

                        <button onClick={() => setIsEditOpen(true)} className={cn("text-right", category.nextBillDate && "cursor-pointer hover:opacity-80")}>
                            {category.nextBillDate ? (
                                <>
                                    <p className="text-xs text-muted-foreground">Next Bill</p>
                                    <p className={cn("text-sm font-bold", (daysLeft !== null && daysLeft <= 5) ? "text-red-500" : "text-foreground")}>
                                        {format(parseISO(category.nextBillDate), 'dd MMM')}
                                        {daysLeft !== null && (
                                            <span className="text-xs font-normal text-muted-foreground ml-1">
                                                ({daysLeft > 0 ? `${daysLeft}d left` : daysLeft === 0 ? 'Today' : `${Math.abs(daysLeft)}d ago`})
                                            </span>
                                        )}
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    Set Bill Date
                                    <Pencil className="w-3 h-3" />
                                </p>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {isEditOpen && (
                <AddCategoryForm
                    onClose={() => setIsEditOpen(false)}
                    editCategoryId={categoryId}
                />
            )}

            {/* Stats Card */}
            <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm text-center mb-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Spent (Month)</p>
                        <h2 className="text-2xl font-bold text-primary">₹{totalSpentThisMonth.toLocaleString()}</h2>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Pending Due</p>
                        <h2 className="text-2xl font-bold text-destructive">₹{pendingBalance.toLocaleString()}</h2>
                    </div>
                </div>

                <SubcategoryPieChart categoryId={categoryId} />
            </div>

            <div className="space-y-4 pb-24 h-full overflow-y-auto">
                <SpendList categoryId={categoryId} />
            </div>

            {/* Mark Paid Modal */}
            {isMarkPaidOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-card text-card-foreground w-full max-w-sm rounded-xl border border-border shadow-xl p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-2">Mark as Paid</h2>
                        <p className="text-sm text-muted-foreground mb-4">Confirm payment for <strong>{category.name}</strong>.</p>

                        <div className="space-y-4">
                            <div className="p-3 bg-muted/50 rounded-lg flex justify-between items-center">
                                <span className="text-sm font-medium">Items to clear</span>
                                <span className="font-bold">{spends.filter(s => !s.isPaid).length}</span>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Total Bill Amount</label>
                                <div className="relative mt-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={customPayAmount}
                                        onChange={(e) => setCustomPayAmount(e.target.value)}
                                        className="w-full bg-muted/50 border border-input rounded-lg pl-8 pr-4 py-2 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                                        step="0.01"
                                        autoFocus
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Original Total: ₹{spends.filter(s => !s.isPaid).reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsMarkPaidOpen(false)}
                                    className="flex-1 py-2 rounded-lg bg-muted hover:bg-muted/80 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        markAllAsPaid(categoryId, parseFloat(customPayAmount));
                                        setIsMarkPaidOpen(false);
                                    }}
                                    className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                                >
                                    Confirm Paid
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-6 right-6 flex flex-col gap-2">
                {/* Floating Action Button for Mark Paid (Only if there are unpaid items) */}
                {spends.some(s => !s.isPaid) && (
                    <button
                        onClick={() => {
                            const total = spends.filter(s => !s.isPaid).reduce((sum, s) => sum + s.amount, 0);
                            setCustomPayAmount(total.toString());
                            setIsMarkPaidOpen(true);
                        }}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold transition-transform active:scale-95"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Pay
                    </button>
                )}
            </div>

        </div>
    );
}
