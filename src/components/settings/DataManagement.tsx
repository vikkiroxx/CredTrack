import { useRef } from 'react';
import { useData } from '../../context/DataContext';
import { Download, Upload, X, AlertTriangle } from 'lucide-react';

export function DataManagement({ onClose }: { onClose: () => void }) {
    const { categories, spends, importData } = useData();
    const fileInputRef = useRef<HTMLInputElement>(null);

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

                    <p className="text-xs text-center text-muted-foreground pt-4">
                        CredTrack v1.0 • Secure Local Storage
                    </p>
                </div>
            </div>
        </div>
    );
}
