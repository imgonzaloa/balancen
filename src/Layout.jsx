import React from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const { t, lang, changeLanguage } = useTranslation();
  
  // ALL HOOKS UNCONDITIONALLY AT TOP - useRef must be here, not inside useEffect
  const isNavigating = React.useRef(false);
  const scrollPositions = React.useRef({ Home: 0, Social: 0 });
  const scrollContainerRef = React.useRef(null);
  const navItems = getNavItems(t);
  const hideNav = noNavPages.includes(currentPageName);
  const isActive = (pageName) => currentPageName === pageName;

  // Save scroll position before page changes
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    return () => {
      if (currentPageName === 'Home' || currentPageName === 'Social') {
        scrollPositions.current[currentPageName] = container.scrollTop;
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
      });
    }
  }, [currentPageName]);

  // ROUTING LOGIC - redirect based on boot state
  React.useEffect(() => {
    if (!bootState || isNavigating.current) return;

    const redirect = (page) => {
      isNavigating.current = true;
      navigate(createPageUrl(page), { replace: true });
      setTimeout(() => { isNavigating.current = false; }, 200);
    };

    if (bootState.type === 'AUTH_REQUIRED' && currentPageName !== 'Home') {
      redirect('Home');
      return;
    }

    if (bootState.type === 'ONBOARDING_REQUIRED' && currentPageName !== 'Onboarding') {
      redirect('Onboarding');
      return;
    }

    if (bootState.type === 'HOME_READY') {
      // Sync language
      if (bootState.language && lang !== bootState.language) {
        changeLanguage(bootState.language).catch(() => {});
      }
      // Only redirect if stuck on onboarding
      if (currentPageName === 'Onboarding') {
        redirect('Home');
      }
    }
  }, [bootState, currentPageName]);

  // RENDER (no conditional returns)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900" style={{ paddingTop: 'env(safe-area-inset-top, 0)', paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
      <Toaster position="top-center" richColors />
      
      {/* Brand Mark - shown on main tabs */}
      {showBrandPages.includes(currentPageName) && (
        <div className="fixed top-0 left-0 right-0 z-40 pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
          <div className="max-w-2xl mx-auto px-6 py-3">
            <BrandMark size={18} />
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
          style={{ paddingTop: showBrandPages.includes(currentPageName) ? '60px' : '0' }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 z-50 safe-area-inset-bottom">
              <div className="max-w-lg mx-auto flex justify-around items-center py-2 px-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.name);
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.name)}
                      onClick={(e) => {
                        // Prevent navigation if already on page
                        if (active) {
                          e.preventDefault();
                        }
                      }}
                      className="relative flex flex-col items-center py-2 px-4 touch-manipulation transition-transform duration-75 active:scale-90 cursor-pointer"
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
                    </Link>
                  );
                })}
              </div>
            </nav>
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

export default function Layout({ children, currentPageName }) {
  return (
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
  );
}