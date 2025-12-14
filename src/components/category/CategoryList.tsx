import { useData } from '../../context/DataContext';
import { Wallet, Trash2 } from 'lucide-react';

export function CategoryList({ onCategoryClick }: { onCategoryClick: (id: string) => void }) {
    const { categories, deleteCategory } = useData();

    if (categories.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground px-1">Your Categories</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {categories.map((category) => (
                    <div
                        key={category.id}
                        onClick={() => onCategoryClick(category.id)}
                        className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md cursor-pointer active:scale-95"
                    >
                        {/* Color accent strip */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-1.5"
                            style={{ backgroundColor: category.color }}
                        />

                        <div className="flex items-center justify-between pl-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="p-2 rounded-lg bg-muted text-muted-foreground"
                                    style={{ color: category.color, backgroundColor: `${category.color}15` }}
                                >
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">{category.name}</h3>
                                    <p className="text-xs text-muted-foreground">0 Spends</p>
                                </div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this category?')) deleteCategory(category.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-2 text-destructive hover:bg-destructive/10 rounded-full transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
