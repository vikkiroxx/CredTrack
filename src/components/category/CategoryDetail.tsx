import { useState, useMemo } from 'react';
import { AddCategoryForm } from './AddCategoryForm';
import { useData } from '../../context/DataContext';
import { SpendList } from '../spends/SpendList';
import { AddSpendForm } from '../spends/AddSpendForm';
import { SubcategoryPieChart } from '../dashboard/SubcategoryPieChart';
import { ArrowLeft, CheckCircle, Pencil, Plus } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { cn } from '../../lib/utils';

type CategoryDetailProps = {
    categoryId: string;
    onBack: () => void;
};

export function CategoryDetail({ categoryId, onBack }: CategoryDetailProps) {
    const { categories, spends: allSpends, markAllAsPaid } = useData();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
    const [isAddSpendOpen, setIsAddSpendOpen] = useState(false);
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

    // With "Bill Settled" logic, the Net Balance is simply the sum of all transactions
    // (Positive Spends - Negative Payments)
    const pendingBalance = spends
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

            {isAddSpendOpen && (
                <AddSpendForm
                    onClose={() => setIsAddSpendOpen(false)}
                    defaultCategoryId={categoryId}
                />
            )}

            {/* Stats Card */}
            <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm text-center mb-6">
                <div className="mb-6">
                    <p className="text-xs text-muted-foreground mb-1">Net Balance</p>
                    <h2 className="text-3xl font-bold text-primary">₹{pendingBalance.toLocaleString()}</h2>
                </div>

                <SubcategoryPieChart categoryId={categoryId} />
            </div>

            {/* Inline Pay Button */}
            <div className="flex justify-end mb-4 px-1">
                {pendingBalance > 0.01 && (
                    <button
                        onClick={() => {
                            setCustomPayAmount(pendingBalance.toFixed(2));
                            setIsMarkPaidOpen(true);
                        }}
                        className="flex items-center gap-2 text-sm font-bold text-primary hover:bg-primary/10 px-4 py-2.5 rounded-lg transition-colors border border-primary/20"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Pay Balance
                    </button>
                )}
            </div>

            <div className="space-y-4 pb-24 h-full overflow-y-auto">
                <SpendList filterCategoryId={categoryId} />
            </div>

            {/* Mark Paid Modal */}
            {isMarkPaidOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-card text-card-foreground w-full max-w-sm rounded-xl border border-border shadow-xl p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-2">Mark as Paid</h2>
                        <p className="text-sm text-muted-foreground mb-4">Confirm payment for <strong>{category.name}</strong>.</p>

                        <div className="space-y-4">
                            <div className="p-3 bg-muted/50 rounded-lg flex justify-between items-center">
                                <span className="text-sm font-medium">Net Pending Balance</span>
                                <span className="font-bold">₹{pendingBalance.toFixed(2)}</span>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Payment Amount</label>
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

            <div className="fixed bottom-6 right-6 flex flex-col gap-3 items-end z-50">
                {/* Add Spend Button - ONLY Add Spend here */}
                <button
                    onClick={() => setIsAddSpendOpen(true)}
                    className="bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all active:scale-90 flex items-center justify-center"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>

        </div>
    );
}
