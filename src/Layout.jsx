import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Users, Award, User } from "lucide-react";
import { Toaster } from "sonner";
import { TranslationProvider, useTranslation } from "@/components/TranslationProvider";
import { MealProvider } from "@/components/MealContext";
import { AppStateProvider } from "@/components/AppStateContext";
import { MealsStoreProvider } from "@/components/MealsStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BootGate from "@/components/BootGate";
import VersionGate from "@/components/VersionGate";
import ErrorBoundary from "@/components/ErrorBoundary";
import BrandMark from "@/components/BrandMark";
import GlobalHeader from "@/components/GlobalHeader";
// framer-motion removed from layout to prevent tab navigation lag
import { NavigationManager, useTabNavigation } from "@/components/NavigationManager";
import { useLocation } from "react-router-dom";
import DebugOverlay, { debugLogger } from "@/components/DebugOverlay";
import PublicDebugPanel from "@/components/PublicDebugPanel";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import TrialGate from "@/components/TrialGate";
import BuildBadge from "@/components/BuildBadge";


// Global React Query client - aggressive caching to prevent rate limits and re-fetches
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
      retryOnMount: false,
    },
  },
});

const noNavPages = ["Onboarding", "Paywall", "CameraScreen", "MealResult", "LanguageSelector", "Premium", "ProfileSetup", "GroupDashboard"];
const showBrandPages = ["Home", "Social", "Progress", "Profile"];
const mainTabs = ["Home", "Social", "Progress", "Profile"];

// ── NavButton extracted as its own component to fix React hooks-in-map violation ──
const NavButton = React.memo(function NavButton({ item, isActive, onNavigate, onScrollTop }) {
  const Icon = item.icon;

  const handleNav = React.useCallback((e) => {
    e.stopPropagation();
    if (isActive) {
      onScrollTop();
      return;
    }
    onNavigate(item.name);
  }, [isActive, item.name, onNavigate, onScrollTop]);

  return (
    <button
      onPointerUp={handleNav}
      className="relative flex flex-col items-center py-2 px-4 transition-transform duration-75 active:scale-90"
      style={{
        pointerEvents: 'auto',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        zIndex: 1
      }}
    >
      {isActive && (
        <div className="absolute -top-1 w-12 h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 rounded-full" />
      )}
      <div className={`p-2.5 rounded-2xl ${isActive ? "bg-gradient-to-br from-teal-500/20 to-emerald-500/20" : ""}`}>
        <Icon size={22} className={isActive ? "text-teal-300" : "text-slate-400"} />
      </div>
      <span className={`text-[10px] mt-0.5 font-semibold ${isActive ? "text-teal-300" : "text-slate-500"}`}>
        {item.label}
      </span>
    </button>
  );
});

function getNavItems(t) {
  return [
    { name: "Home", icon: Home, label: t("home_tab") },
    { name: "Social", icon: Users, label: t("social_tab") },
    { name: "Progress", icon: Award, label: t("progress_tab") },
    { name: "Profile", icon: User, label: t("profile_tab") }
  ];
}

function LayoutInner({ children, currentPageName, bootState }) {
  const navigate = useNavigate();
  const { t, lang, changeLanguage } = useTranslation();

  // STABILITY: confirm root layout mounts only once
  React.useEffect(() => {
    console.log('ROOT MOUNT');
  }, []);

  const { navigateToTab } = useTabNavigation();
    const scrollPositions = React.useRef({});
    const scrollContainerRef = React.useRef(null);
    const bottomNavRef = React.useRef(null);
    const [debugOpen, setDebugOpen] = React.useState(false);

  const location = useLocation();

  // Log every route change
  React.useEffect(() => {
    console.log('ROUTE CHANGE', location.pathname);
  }, [location.pathname]);

  const navItems = React.useMemo(() => getNavItems(t), [t]);
  const hideNav = noNavPages.includes(currentPageName);
  
  // These pages must NOT be gated — they ARE the auth/onboarding/payment flow itself
  const bypassTrialGate = ["Paywall", "Onboarding", "LanguageSelector", "Premium", "ProfileSetup"].includes(currentPageName);

  // Save + restore scroll positions per tab
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    return () => {
      if (mainTabs.includes(currentPageName)) {
        scrollPositions.current[currentPageName] = container.scrollTop;
      }
    };
  }, [currentPageName]);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTop = mainTabs.includes(currentPageName)
        ? (scrollPositions.current[currentPageName] || 0)
        : 0;
    });
  }, [currentPageName]);

  // Language sync: apply language from bootState once hydrated
  // This is the ONLY place language is synced from boot → i18n at startup
  React.useEffect(() => {
    if (!bootState?.isHydrated) return;
    const targetLang = bootState.language;
    if (targetLang && targetLang !== lang && (targetLang === 'en' || targetLang === 'es')) {
      changeLanguage(targetLang).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootState?.isHydrated, bootState?.language]);

  // Set --bottom-nav-height and --bottom-inset CSS variables from actual nav
  React.useEffect(() => {
    if (!bottomNavRef.current) return;
    const navHeight = bottomNavRef.current.getBoundingClientRect().height || 0;
    document.documentElement.style.setProperty('--bottom-nav-height', navHeight + 'px');
    document.documentElement.style.setProperty('--bottom-inset', `calc(${navHeight}px + env(safe-area-inset-bottom, 0px))`);
  });

  // Prevent hardware back from leaving main tabs
  React.useEffect(() => {
    const handlePopState = () => {
      if (mainTabs.includes(currentPageName)) {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    }, [currentPageName]);

    // Listen for debug panel open — only when debug=1
    React.useEffect(() => {
    const isDebug = new URLSearchParams(window.location.search).get('debug') === '1' || localStorage.getItem('DEBUG_OVERLAY') === '1';
    if (!isDebug) return;
    const handler = () => setDebugOpen(true);
    window.addEventListener('balancen-open-debug', handler);
    return () => window.removeEventListener('balancen-open-debug', handler);
    }, []);

  const handleNavigate = React.useCallback((pageName) => {
      navigateToTab(pageName);
    }, [navigateToTab]);

  const handleScrollTop = React.useCallback(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Only show the global header on pages where it makes sense (hide on full-screen flows)
  const hideHeader = ["Onboarding", "Paywall", "CameraScreen", "MealResult", "LanguageSelector", "Premium", "ProfileSetup"].includes(currentPageName);

  return (
    <div
      className="bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900"
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                paddingTop: 'env(safe-area-inset-top, 0)',
                position: 'relative',
                overflow: 'hidden',
              }}
    >
      <BuildBadge currentPageName={currentPageName} />
      <NavigationManager />
      <PublicDebugPanel />
      <Toaster position="top-center" richColors style={{ pointerEvents: 'auto' }} />

      {/* Global header bar — Logo left, avatar right */}
      {!hideHeader && <GlobalHeader />}

      {/* Main scroll container - with padding for fixed bottom nav */}
      <main
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          position: 'relative',
          zIndex: 1,
          pointerEvents: 'auto',
          willChange: 'scroll-position',
          paddingBottom: hideNav ? 0 : 'calc(72px + env(safe-area-inset-bottom, 0))'
        }}
      >
        <div
          key={location.key}
          className={
            location.state?.tabSwitch || location.state?.tabRoot
              ? 'route-tab-switch'
              : location.state?.back
              ? 'route-enter-back'
              : 'route-enter'
          }
          style={{ minHeight: '100%' }}
        >
          {bypassTrialGate ? children : <TrialGate>{children}</TrialGate>}
        </div>
      </main>

      {/* Fixed Tab bar - pinned to viewport */}
      {!hideNav && (
        <nav
          ref={bottomNavRef}
          className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10"
            style={{
              zIndex: 1000,
            pointerEvents: 'auto',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            paddingBottom: 'env(safe-area-inset-bottom, 0)',
            width: '100%'
          }}
        >
          <div className="max-w-lg mx-auto flex justify-around items-center py-2 px-4">
            {navItems.map((item) => (
              <NavButton
                key={item.name}
                item={item}
                isActive={currentPageName === item.name}
                onNavigate={handleNavigate}
                onScrollTop={handleScrollTop}
              />
            ))}
          </div>
        </nav>
      )}

      {/* DEBUG: red line at --bottom-inset — remove once confirmed correct */}
      <div style={{
        position: 'fixed',
        bottom: 'var(--bottom-inset, 0px)',
        left: 0, right: 0,
        height: '2px',
        background: 'red',
        zIndex: 99998,
        pointerEvents: 'none',
      }} />

      {/* Debug overlay */}
      {debugOpen && (
        <div className="fixed inset-0 z-[99999]" style={{ pointerEvents: 'auto' }}>
          <DebugOverlay />
          <button
            onClick={() => setDebugOpen(false)}
            className="fixed inset-0 bg-black/80"
            style={{ pointerEvents: 'auto' }}
          />
        </div>
      )}
    </div>
  );
}

// Stable providers tree — mounted once, never recreated on navigation
function AppProviders({ children, bootState }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <MealsStoreProvider>
          <AppStateProvider>
            <MealProvider>
              {children}
            </MealProvider>
          </AppStateProvider>
        </MealsStoreProvider>
      </TranslationProvider>
    </QueryClientProvider>
  );
}

// Ensure overlay-root exists in DOM (fallback if index.html doesn't have it)
if (typeof document !== 'undefined' && !document.getElementById('overlay-root')) {
  const overlayRoot = document.createElement('div');
  overlayRoot.id = 'overlay-root';
  overlayRoot.style.cssText = 'position:fixed;inset:0;z-index:10000;pointer-events:none;';
  document.body.appendChild(overlayRoot);
}

export default function Layout({ children, currentPageName }) {
  return (
    <GlobalErrorBoundary>
      <VersionGate>
        <ErrorBoundary screen="Layout">
          <BootGate>
            {({ bootState }) => (
              <AppProviders bootState={bootState}>
                <LayoutInner currentPageName={currentPageName} bootState={bootState}>
                  {children}
                </LayoutInner>
              </AppProviders>
            )}
          </BootGate>
        </ErrorBoundary>
      </VersionGate>
    </GlobalErrorBoundary>
  );
}