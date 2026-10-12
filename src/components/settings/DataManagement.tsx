import { useRef } from 'react';
import { useData } from '../../context/DataContext';
import { Download, Upload, X, AlertTriangle, CreditCard, Sparkles } from 'lucide-react';

export function DataManagement({ onClose }: { onClose: () => void }) {
    const { categories, spends, importData, clearAllData, autoMergeScapiaCards } = useData();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const hasDualScapia = categories.some(c => c.name.toLowerCase().includes('scapia') && c.name.toLowerCase().includes('rupay')) &&
        categories.some(c => c.name.toLowerCase().includes('scapia') && (c.name.toLowerCase().includes('visa') || !c.name.toLowerCase().includes('rupay')));

    const handleExport = () => {
        const data = {
            categories,
            spends,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `credtrack_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (confirm('This will replace ALL current data with the backup. Are you sure?')) {
                    importData(json);
                    onClose();
                }
            } catch (err) {
                alert('Failed to parse backup file.');
                console.error(err);
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-card text-card-foreground w-full max-w-sm rounded-xl border border-border shadow-xl p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        Data Backup
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">

                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg flex gap-3 items-start">
                        <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                            Your data is stored <b>locally on this device</b>. Creates a backup file to save your data or transfer it to another device.
                        </p>
                    </div>

                    {hasDualScapia && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2.5">
                            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                                <CreditCard className="w-4 h-4" />
                                Merge Scapia Cards (Single Bill)
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                We detected separate "Scapia Rupay" and "Scapia Visa" cards. Federal Bank Scapia generates a single bill statement for both cards. Merge them into 1 unified "Scapia" card.
                            </p>
                            <button
                                onClick={async () => {
                                    await autoMergeScapiaCards();
                                    alert('Scapia cards merged successfully into 1 unified card!');
                                }}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Merge Scapia Cards Now
                            </button>
                        </div>
                    )}

                    <div className="grid gap-4">
                        <button
                            onClick={handleExport}
                            className="flex items-center justify-between w-full p-4 bg-muted/50 border border-border rounded-xl hover:bg-muted transition-all group"
                        >
                            <div className="text-left">
                                <p className="font-bold flex items-center gap-2">
                                    <Download className="w-5 h-5 text-green-500" />
                                    Export Data
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Save backup file (.json)</p>
                            </div>
                        </button>

                        <div className="relative">
                            <button
                                onClick={handleImportClick}
                                className="flex items-center justify-between w-full p-4 bg-muted/50 border border-border rounded-xl hover:bg-muted transition-all group"
                            >
                                <div className="text-left">
                                    <p className="font-bold flex items-center gap-2">
                                        <Upload className="w-5 h-5 text-blue-500" />
                                        Import Data
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">Restore from backup file</p>
                                </div>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                className="hidden"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h3>
                        <button
                            onClick={() => {
                                if (confirm('ARE YOU SURE? This will permanently delete ALL your categories and spends. This action cannot be undone.')) {
                                    clearAllData();
                                    onClose();
                                }
                            }}
                            className="flex items-center justify-between w-full p-4 bg-destructive/10 border border-destructive/20 rounded-xl hover:bg-destructive/20 transition-all group"
                        >
                            <div className="text-left">
                                <p className="font-bold flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="w-5 h-5" />
                                    Reset App Data
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Clear all categories and spends</p>
                            </div>
                        </button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground pt-4">
                        CredTrack v1.0 • Secure Local Storage
                    </p>
                </div>
            </div>
        </div>
    );
}
