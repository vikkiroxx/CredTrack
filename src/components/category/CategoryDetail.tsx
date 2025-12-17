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
    const { categories, markAllAsPaid } = useData();
    const [isAddSpendOpen, setIsAddSpendOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false); // State for edit modal

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
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditOpen(true)}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            <h2 className="text-xl font-bold">{category.name}</h2>
                            <div className="opacity-50 group-hover:opacity-100 transition-opacity">
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

            <div className="flex justify-end mb-4 px-1">
                <button
                    onClick={() => {
                        if (confirm('Are you sure you want to mark ALL pending spends in this category as PAID?')) {
                            markAllAsPaid(categoryId);
                        }
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <CheckCircle className="w-4 h-4" />
                    Mark All as Paid
                </button>
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
