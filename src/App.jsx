import { Toaster } from "@/components/ui/toaster"
import { Suspense, lazy } from 'react'
import ProgressPhotos from './pages/ProgressPhotos'
import TeamMode from './pages/TeamMode'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { MealProvider } from '@/components/MealContext';
import { useEffect } from 'react';

// iPad detection
function isIPad() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /ipad|macintosh/.test(ua) && 'ontouchend' in document || (window.screen?.width > 768 && /ipad/.test(ua));
}

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    const el = document.querySelector('[data-scroll-container]');
    if (el) {
      el.scrollTop = 0;
    }
  }, [pathname]);
  return null;
}

function IPadLayout({ children }) {
  const isIPadDevice = isIPad();
  if (!isIPadDevice) return children;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'stretch',
      minHeight: '100vh',
      backgroundColor: '#0f172a'
    }}>
      <div style={{
        width: '390px',
        maxWidth: '100vw',
        height: '100vh',
        overflow: 'hidden',
        boxShadow: isIPadDevice ? '0 0 30px rgba(0,0,0,0.3)' : 'none'
      }}>
        {children}
      </div>
    </div>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  const fallback = (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
      <div className="w-8 h-8 border-4 border-slate-600 border-t-teal-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={fallback}>
      <Routes>
        <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/TeamMode" element={
        <LayoutWrapper currentPageName="TeamMode">
          <TeamMode />
        </LayoutWrapper>
      } />
      <Route path="/ProgressPhotos" element={
        <LayoutWrapper currentPageName="ProgressPhotos">
          <ProgressPhotos />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
      </Routes>
      </Suspense>
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <MealProvider>
            <NavigationTracker />
            <IPadLayout>
              <AuthenticatedApp />
            </IPadLayout>
          </MealProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App