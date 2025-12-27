import { useState } from 'react';
import { AddCategoryForm } from './AddCategoryForm';
import { useData } from '../../context/DataContext';
import { SpendList } from '../spends/SpendList';
import { AddSpendForm } from '../spends/AddSpendForm';
import { SubcategoryPieChart } from '../dashboard/SubcategoryPieChart';
import { ArrowLeft, Plus, CheckCircle } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { cn } from '../../lib/utils';

type CategoryDetailProps = {
    categoryId: string;
    onBack: () => void;
};

export function CategoryDetail({ categoryId, onBack }: CategoryDetailProps) {
    const { categories, spends, markAllAsPaid } = useData();
    const [isAddSpendOpen, setIsAddSpendOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false); // State for edit modal
    const [isMarkPaidOpen, setIsMarkPaidOpen] = useState(false);
    const [customPayAmount, setCustomPayAmount] = useState('');

    const category = categories.find(c => c.id === categoryId);

    if (!category) return null;

    const daysLeft = category.nextBillDate
        ? differenceInDays(parseISO(category.nextBillDate), new Date())
        : null;

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
                                {/* Small edit indicator */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
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
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
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

            <SubcategoryPieChart categoryId={categoryId} />

            {/* Mark Paid Modal */}
            {isMarkPaidOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-card text-card-foreground w-full max-w-sm rounded-xl border border-border shadow-xl p-6 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-2">Mark as Paid</h2>
                        <p className="text-sm text-muted-foreground mb-4">Confirm payment for <strong>{category.name}</strong>.</p>

                        <div className="space-y-4">
                            <div className="p-3 bg-muted/50 rounded-lg flex justify-between items-center">
                                <span className="text-sm font-medium">Items to clear</span>
                                <span className="font-bold">{spends.filter(s => s.categoryId === categoryId && !s.isPaid).length}</span>
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
                                    Original Total: ₹{spends.filter(s => s.categoryId === categoryId && !s.isPaid).reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
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

            <div className="flex justify-end mb-4 px-1">
                {spends.some(s => s.categoryId === categoryId && !s.isPaid) && (
                    <button
                        onClick={() => {
                            const total = spends.filter(s => s.categoryId === categoryId && !s.isPaid).reduce((sum, s) => sum + s.amount, 0);
                            setCustomPayAmount(total.toString());
                            setIsMarkPaidOpen(true);
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Mark All as Paid
                    </button>
                )}
            </div>

            <SpendList filterCategoryId={categoryId} />

            {/* Floating Action Button for this Category */}
            <button
                onClick={() => setIsAddSpendOpen(true)}
                className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all active:scale-90 z-20 flex items-center justify-center"
            >
                <Plus className="w-6 h-6" />
            </button>

            {isAddSpendOpen && (
                <AddSpendForm
                    onClose={() => setIsAddSpendOpen(false)}
                    defaultCategoryId={categoryId}
                />
            )}
        </div>
    );
}
