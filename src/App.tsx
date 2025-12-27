import { useState, useEffect } from 'react';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { CategoryList } from './components/category/CategoryList';
import { CategoryDetail } from './components/category/CategoryDetail';
import { AddCategoryForm } from './components/category/AddCategoryForm';
import { AddSpendForm, type InitialSpendData } from './components/spends/AddSpendForm';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { SpendingPieChart } from './components/dashboard/SpendingPieChart';
import { MonthlySummary } from './components/dashboard/MonthlySummary';
import { DataManagement } from './components/settings/DataManagement';
import { SpendHistory } from './components/spends/SpendHistory';
import { Plus, PieChart as PieChartIcon, ArrowLeft, Settings, Search } from 'lucide-react';
import { MonthlyBarChart } from './components/dashboard/MonthlyBarChart';
import pkg from '../package.json';

type ViewState =
  | { type: 'HOME' }
  | { type: 'CATEGORY', categoryId: string }
  | { type: 'INSIGHTS' }
  | { type: 'HISTORY' };

function AppContent() {
  const { user, loading } = useAuth();

  // Helper to parse hash
  const getViewFromHash = (): ViewState => {
    const hash = window.location.hash;
    if (hash.startsWith('#/category/')) {
      const id = hash.replace('#/category/', '');
      return { type: 'CATEGORY', categoryId: id };
    }
    if (hash === '#/insights') return { type: 'INSIGHTS' };
    if (hash === '#/history') return { type: 'HISTORY' };
    return { type: 'HOME' };
  };

  const [view, setView] = useState<ViewState>(getViewFromHash);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
  const [spendInitialData, setSpendInitialData] = useState<InitialSpendData | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    console.log("CredTrack Version: 0.1.3 Loaded");
    const handleHashChange = () => {
      setView(getViewFromHash());
    };

    // Set initial hash if empty
    if (!window.location.hash) {
      window.location.replace('#/');
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);


  const navigateToInsights = () => window.location.hash = '#/insights';
  const navigateToHistory = () => window.location.hash = '#/history';
  const navigateToCategory = (id: string) => window.location.hash = `#/category/${id}`;

  const goBack = () => {
    window.history.back();
  };

  const openAddSpend = (data?: InitialSpendData) => {
    setSpendInitialData(data);
    setIsSpendModalOpen(true);
  };

  const closeAddSpend = () => {
    setIsSpendModalOpen(false);
    setSpendInitialData(undefined); // Clear data on close
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <DataProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col relative">
        {/* Header */}
        <header className="p-4 border-b border-border bg-card sticky top-0 z-20 flex justify-between items-center shadow-sm">
          {view.type === 'HOME' ? (
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-primary tracking-tight leading-none">CredTrack</h1>
              <span className="text-[0.6rem] text-muted-foreground font-mono">v{pkg.version}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="p-1 hover:bg-muted rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-primary tracking-tight">
                {view.type === 'INSIGHTS' ? 'Insights' : view.type === 'HISTORY' ? 'History' : 'CredTrack'}
              </h1>
            </div>
          )}

          <div className="flex items-center gap-2">
            {view.type === 'HOME' && (
              <>
                <button
                  onClick={navigateToInsights}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  title="View Insights"
                >
                  <PieChartIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={navigateToHistory}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  title="History"
                >
                  <Search className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </>
            )}
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-y-auto max-w-md mx-auto w-full">
          {view.type === 'HOME' ? (
            <>
              <MonthlySummary onPayClick={openAddSpend} />

              {/* Categories */}
              <div className="mb-6">
                <CategoryList onCategoryClick={navigateToCategory} />
              </div>

              <div className="h-20"></div> {/* Spacer for FAB */}
            </>
          ) : view.type === 'INSIGHTS' ? (
            <div className="space-y-6">
              <MonthlyBarChart />
              <SpendingPieChart />
            </div>
          ) : view.type === 'HISTORY' ? (
            <SpendHistory />
          ) : (
            <CategoryDetail
              categoryId={view.categoryId}
              onBack={goBack}
            />
          )}
        </main>

        {/* Floating Action Button (Only on Home) */}
        {view.type === 'HOME' && (
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all active:scale-90 z-20 flex items-center justify-center"
            aria-label="Add Category"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* Modals */}
        {isCategoryModalOpen && (
          <AddCategoryForm onClose={() => setIsCategoryModalOpen(false)} />
        )}

        {isSpendModalOpen && (
          <AddSpendForm onClose={closeAddSpend} initialData={spendInitialData} />
        )}

        {isSettingsOpen && (
          <DataManagement onClose={() => setIsSettingsOpen(false)} />
        )}
      </div>
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
