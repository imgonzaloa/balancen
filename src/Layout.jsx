import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import { motion, AnimatePresence } from "framer-motion";
import { NavigationManager } from "@/components/NavigationManager";
import DebugOverlay, { debugLogger } from "@/components/DebugOverlay";
import PublicDebugPanel from "@/components/PublicDebugPanel";

function getNavItems(t) {
  return [
    { name: "Home", icon: Home, label: t("home_tab") },
    { name: "Social", icon: Users, label: t("social_tab") },
    { name: "Progress", icon: Award, label: t("progress_tab") },
    { name: "Profile", icon: User, label: t("profile_tab") }
  ];
}

const noNavPages = ["Onboarding", "Paywall", "CameraScreen", "MealResult", "LanguageSelector", "Premium"];
const showBrandPages = ["Home", "Social", "Progress", "Profile"];

function LayoutInner({ children, currentPageName, bootState }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang, changeLanguage } = useTranslation();
  
  // ALL HOOKS UNCONDITIONALLY AT TOP - useRef must be here, not inside useEffect
  const isNavigating = React.useRef(false);
  const scrollPositions = React.useRef({ Home: 0, Social: 0 });
  const scrollContainerRef = React.useRef(null);
  const navItems = getNavItems(t);
  const hideNav = noNavPages.includes(currentPageName);
  const isActive = (pageName) => currentPageName === pageName;
  
  // Debug overlay
  const [debugOpen, setDebugOpen] = React.useState(false);
  const tapCount = React.useRef(0);
  const tapTimer = React.useRef(null);
  const longPressTimer = React.useRef(null);

  // Save scroll position before page changes
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    return () => {
      if (currentPageName === 'Home' || currentPageName === 'Social') {
        scrollPositions.current[currentPageName] = container.scrollTop;
        console.log(`[SCROLL] Saved ${currentPageName} position:`, container.scrollTop);
      }
    };
  }, [currentPageName]);

  // Restore scroll position after page loads
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    if (currentPageName === 'Home' || currentPageName === 'Social') {
      const savedPosition = scrollPositions.current[currentPageName] || 0;
      requestAnimationFrame(() => {
        container.scrollTop = savedPosition;
        console.log(`[SCROLL] Restored ${currentPageName} position:`, savedPosition);
      });
    } else {
      // Reset to top for other pages
      requestAnimationFrame(() => {
        container.scrollTop = 0;
      });
    }
  }, [currentPageName]);

  // ROUTING LOGIC - stable, loop-free redirects
  React.useEffect(() => {
    if (!bootState?.isHydrated || isNavigating.current) return;

    const redirect = (page, reason) => {
      // Prevent redirect if already on target page
      if (currentPageName === page) {
        console.log(`[ROUTING] Already on ${page}, skipping redirect`);
        return;
      }
      
      console.log(`[ROUTING] Redirect: ${currentPageName} -> ${page} (${reason})`);
      isNavigating.current = true;
      navigate(createPageUrl(page), { replace: true });
      setTimeout(() => { isNavigating.current = false; }, 300);
    };

    // Anonymous users stay on Home
    if (bootState.type === 'AUTH_REQUIRED' && currentPageName !== 'Home') {
      redirect('Home', 'anonymous');
      return;
    }

    // Onboarding incomplete - only redirect if NOT already on Onboarding
    if (bootState.type === 'ONBOARDING_REQUIRED' && !bootState.onboardingComplete) {
      redirect('Onboarding', 'incomplete');
      return;
    }

    // Authenticated + complete - sync language and leave onboarding
    if (bootState.type === 'HOME_READY' && bootState.onboardingComplete) {
      // Sync language once
      if (bootState.language && lang !== bootState.language) {
        changeLanguage(bootState.language).catch(() => {});
      }
      
      // Only redirect away from Onboarding (user might be anywhere else)
      if (currentPageName === 'Onboarding') {
        redirect('Home', 'completed');
      }
    }
  }, [bootState?.isHydrated, bootState?.type, bootState?.onboardingComplete, currentPageName]);

  // Handle browser/app back button
  React.useEffect(() => {
    const handlePopState = (e) => {
      const mainPages = ['Home', 'Social', 'Progress', 'Profile'];
      if (mainPages.includes(currentPageName)) {
        // Prevent back navigation from main tabs
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentPageName]);

  // RENDER (no conditional returns)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900" style={{ paddingTop: 'env(safe-area-inset-top, 0)', paddingBottom: 'env(safe-area-inset-bottom, 0)', position: 'relative' }}>
      <NavigationManager />
      <PublicDebugPanel />
      <Toaster position="top-center" richColors style={{ pointerEvents: 'auto' }} />
      
      {/* Brand Mark - shown on main tabs - triple tap to open debug */}
      {showBrandPages.includes(currentPageName) && (
        <div className="fixed top-0 left-0 right-0 z-40 pt-safe" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div 
            className="max-w-2xl mx-auto px-6 py-1.5"
            onTouchStart={() => {
              tapCount.current++;
              if (tapTimer.current) clearTimeout(tapTimer.current);
              
              if (tapCount.current === 3) {
                setDebugOpen(true);
                debugLogger.log('DEBUG_OVERLAY', 'Opened via triple tap');
                tapCount.current = 0;
              }
              
              tapTimer.current = setTimeout(() => {
                tapCount.current = 0;
              }, 500);
              
              // Long press
              longPressTimer.current = setTimeout(() => {
                setDebugOpen(true);
                debugLogger.log('DEBUG_OVERLAY', 'Opened via long press');
              }, 2000);
            }}
            onTouchEnd={() => {
              if (longPressTimer.current) clearTimeout(longPressTimer.current);
            }}
          >
            <BrandMark size={16} />
          </div>
        </div>
      )}
      
      <AnimatePresence mode="wait">
        <motion.main
          ref={scrollContainerRef}
          key={currentPageName}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={hideNav ? "" : "pb-20"}
          style={{ 
            paddingTop: showBrandPages.includes(currentPageName) ? '40px' : '0',
            position: 'relative',
            zIndex: 1,
            pointerEvents: 'auto',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            height: '100%'
          }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {!hideNav && (
        <nav 
          className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 safe-area-inset-bottom" 
          style={{ 
            zIndex: 10000,
            pointerEvents: 'auto',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <div className="max-w-lg mx-auto flex justify-around items-center py-2 px-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.name);
                  
                  // Memoized handler to prevent re-creation on every render
                  const handleNavigation = React.useCallback((e) => {
                    if (e) e.preventDefault();
                    
                    // Already on page - just scroll
                    if (active) {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                      return;
                    }
                    
                    // Navigate immediately
                    debugLogger.log('TAB_CLICK', item.name, { current: currentPageName });
                    navigate(createPageUrl(item.name), { replace: true });
                  }, [active, item.name, currentPageName]);
                  
                  return (
                    <button
                      key={item.name}
                      onPointerUp={handleNavigation}
                      onClick={handleNavigation}
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
                      {active && (
                        <div className="absolute -top-1 w-12 h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 rounded-full" />
                      )}
                      <div className={`p-2.5 rounded-2xl ${active ? "bg-gradient-to-br from-teal-500/20 to-emerald-500/20" : ""}`}>
                        <Icon size={22} className={active ? "text-teal-300" : "text-slate-400"} />
                      </div>
                      <span className={`text-[10px] mt-0.5 font-semibold ${active ? "text-teal-300" : "text-slate-500"}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
        )}

        {/* Debug Overlay */}
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

        // Global React Query client with aggressive caching to prevent rate limits
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: {
              staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
              cacheTime: 30 * 60 * 1000, // 30 minutes cache
              refetchOnWindowFocus: false,
              refetchOnMount: false,
              refetchOnReconnect: false,
              retry: false, // No retries - prevents rate limit cascade
              retryOnMount: false,
            },
          },
        });

import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";

export default function Layout({ children, currentPageName }) {
  return (
    <GlobalErrorBoundary>
      <VersionGate>
        <ErrorBoundary screen="Layout">
          <BootGate>
          {({ bootState }) => (
            <QueryClientProvider client={queryClient}>
              <TranslationProvider>
                <MealsStoreProvider>
                  <AppStateProvider>
                    <MealProvider>
                      <LayoutInner currentPageName={currentPageName} bootState={bootState}>
                        {children}
                      </LayoutInner>
                    </MealProvider>
                  </AppStateProvider>
                </MealsStoreProvider>
              </TranslationProvider>
            </QueryClientProvider>
          )}
        </BootGate>
      </ErrorBoundary>
    </VersionGate>
    </GlobalErrorBoundary>
  );
}