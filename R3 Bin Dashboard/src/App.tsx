import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/sidebar';
import { Overview } from './components/overview';
import { BinStatus } from './components/bin-status';
import { DatabaseView } from './components/database-view'; // ← NEW IMPORT
import { LocationTracker } from './components/location-tracker';
import { Analytics } from './components/analytics';
import { Settings } from './components/settings';
import { AlertSystem } from './components/alert-system';
import { BinDataProvider } from './components/bin-data-context';
import { SettingsProvider, useSettings } from './components/settings-context';
import { TranslationProvider, useTranslation } from './components/translation-context';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Menu, X, ArrowRight } from 'lucide-react';
import { AuthProvider, useAuth } from "./components/auth-context";
import { Login } from "./components/Login";
import TestAuth from './components/TestAuth'
import Register from './components/Register';
import AuthCallback from './components/auth-callback';
import EmailVerified from './components/email-verified';

function HomeScreen({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const { binName } = useSettings();
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background images */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1748609160056-7b95f30041f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmFseXRpY3MlMjBkYXNoYm9hcmQlMjBjaGFydHN8ZW58MXx8fHwxNzU3Mzk3MDkwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Analytics Dashboard"
          className="absolute top-0 left-0 w-full h-full object-cover opacity-50"
        />
        <img 
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXRhJTIwdmlzdWFsaXphdGlvbiUyMG1vbml0b3Jpbmd8ZW58MXx8fHwxNzU3NDY1NDk1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Data Visualization"
          className="absolute top-0 right-0 w-1/2 h-full object-cover opacity-50 mix-blend-overlay"
        />
      </div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/30 rounded-full blur-3xl"></div>
      
      <div className="text-center space-y-8 max-w-lg mx-auto relative z-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight font-[Alfa_Slab_One]">
              {binName}
            </h1>
            <div className="h-1 w-24 bg-primary mx-auto rounded-full"></div>
          </div>
          <p className="text-muted-foreground text-xl md:text-2xl font-[Adamina]">
            {t('smartWasteManagement')}
          </p>
          <p className="text-muted-foreground/80 text-sm md:text-base max-w-md mx-auto font-[Abhaya_Libre]">
            {t('realTimeMonitoring')}
          </p>
        </div>
        
        <Button 
          onClick={onEnterDashboard}
          size="lg"
          className="text-lg px-10 py-7 group shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {t('goToDashboard')}
          <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const { t } = useTranslation();

  // Scroll to top whenever activeTab changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);

  // Close sidebar when tab changes on mobile
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'bins':
        return <BinStatus />;
      case 'database':  // ← NEW CASE
        return <DatabaseView />;  // ← NEW CASE
      case 'location':
        return <LocationTracker />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen bg-background relative">
      {/* Mobile/Tablet Header */}
      <div className="xl:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border p-3 sm:p-4 flex items-center justify-between">
        <h1 className="text-base sm:text-lg md:text-xl font-medium truncate">{t('dashboard')}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="sm:p-2.5 shrink-0 px-[16px] py-[7px] mx-[3px] my-[-1px]"
        >
          {sidebarOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
        </Button>
      </div>

      {/* Sidebar Overlay for Mobile/Tablet */}
      {sidebarOpen && (
        <div 
          className="xl:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed xl:relative xl:translate-x-0 transition-transform duration-300 ease-in-out z-40
        w-64 sm:w-72 md:w-80 xl:w-64 2xl:w-72
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        xl:flex xl:flex-col
      `}>
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto xl:ml-0">
        <div className="pt-14 sm:pt-16 xl:pt-0 px-3 sm:px-4 md:px-5 xl:px-6 2xl:px-8 py-4 sm:py-5 xl:py-6">
          <div className="max-w-7xl 2xl:max-w-[1920px] mx-auto">
            {renderContent()}
          </div>
        </div>
        {/* Alert System - monitors bin levels and shows notifications */}
        <AlertSystem />
      </main>
    </div>
  );
}

export default function App() {
  const [showHome, setShowHome] = useState(true);
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [hasEnteredDashboard, setHasEnteredDashboard] = useState(false);

  const handleLanguageChange = () => {
    // Reset to overview page when language changes
    setShowHome(false);
    setDashboardVisible(true);
    setHasEnteredDashboard(true);
  };

  return (
    <TranslationProvider onLanguageChange={handleLanguageChange}>
      <SettingsProvider>
        <BinDataProvider>
          <AuthProvider>
          <AppContent 
            showHome={showHome}
            setShowHome={setShowHome}
            dashboardVisible={dashboardVisible}
            setDashboardVisible={setDashboardVisible}
            hasEnteredDashboard={hasEnteredDashboard}
            setHasEnteredDashboard={setHasEnteredDashboard}
          />
          <Toaster />
          </AuthProvider>
        </BinDataProvider>
      </SettingsProvider>
    </TranslationProvider>
  );
}

function AppContent({ 
  showHome, 
  setShowHome, 
  dashboardVisible, 
  setDashboardVisible, 
  hasEnteredDashboard, 
  setHasEnteredDashboard 
}: {
  showHome: boolean;
  setShowHome: (show: boolean) => void;
  dashboardVisible: boolean;
  setDashboardVisible: (visible: boolean) => void;
  hasEnteredDashboard: boolean;
  setHasEnteredDashboard: (entered: boolean) => void;
}) {
  const { setSystemSettings } = useSettings();
  const { user, loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    console.log("🔄 AppContent: Still loading auth...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-600 hover:underline text-sm"
          >
            Stuck? Click to reload
          </button>
        </div>
      </div>
    );
  }

  console.log("✅ AppContent: Auth loaded - user:", user?.email);

  // Check current route
  const currentPath = window.location.pathname;
  
  if(!user) {
    console.log("🔒 No user, redirecting to auth page");
    if (currentPath === '/register') {
      return <Register />;
    } else if (currentPath === '/auth/callback') {
      return <AuthCallback />;
    } else if (currentPath === '/email-verified') {
      return <EmailVerified />;
    }
    return <Login />;
  }

  const handleEnterDashboard = () => {
    // Force light mode when entering dashboard
    setSystemSettings(prev => ({ ...prev, darkMode: false }));
    document.documentElement.classList.remove('dark');
    
    setShowHome(false);
    setHasEnteredDashboard(true);
    // Small delay to ensure smooth transition
    setTimeout(() => {
      setDashboardVisible(true);
    }, 100);
  };

  const handleResetToOverview = () => {
    if (hasEnteredDashboard) {
      // If user has already entered dashboard, reset goes to overview
      setShowHome(false);
      setDashboardVisible(true);
    } else {
      // If somehow we need to reset before entering dashboard, go to home
      setShowHome(true);
      setDashboardVisible(false);
    }
  };

  return (
    <>
      {showHome ? (
        <HomeScreen onEnterDashboard={handleEnterDashboard} />
      ) : (
        <div 
          className={`transition-all duration-700 ease-out ${
            dashboardVisible 
              ? 'opacity-100 transform translate-y-0' 
              : 'opacity-0 transform translate-y-4'
          }`}
        >
          <DashboardContent />
        </div>
      )}
    </>
  );
}