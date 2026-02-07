import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Users, Award, User } from "lucide-react";
import { motion } from "framer-motion";
import { Toaster } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { MealProvider } from "@/components/MealContext";
import { useState, useEffect } from "react";
import React from "react";
import PerformanceMonitor from "@/components/PerformanceMonitor";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AppStateProvider } from "@/components/AppStateContext";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import VersionGate from "@/components/VersionGate";
import iOSOptimizer from "@/components/iOSOptimizer";
import { SafeModeProvider } from "@/components/SafeModeProvider";
import TabErrorBoundary from "@/components/TabErrorBoundary";
import { logger } from "@/components/logger";

const navItemsBase = [
  { name: "Home", icon: Home, key: "home" },
  { name: "Social", icon: Users, key: "social" },
  { name: "Progress", icon: Award, key: "progress" },
  { name: "Profile", icon: User, key: "profile" },
];

// Persistent tab containers
const persistentPages = ["Home", "Social", "Progress", "Profile"];

export default function Layout({ children, currentPageName }) {
    const hideNav = ["Onboarding", "Paywall", "CameraScreen", "MealResult"].includes(currentPageName);
    const { t, lang } = useTranslation();
    const [direction, setDirection] = useState(0);
    const [prevPage, setPrevPage] = useState(currentPageName);
    const [isNavigating, setIsNavigating] = useState(false);
    const [mountedPages, setMountedPages] = useState({});
    const [darkMode, setDarkMode] = useState(false);

  // Keep tabs mounted for instant switching
  const isPersistentPage = persistentPages.includes(currentPageName);
  
  useEffect(() => {
    if (isPersistentPage && !mountedPages[currentPageName]) {
      setMountedPages(prev => ({ ...prev, [currentPageName]: true }));
    }
  }, [currentPageName, isPersistentPage]);

  // Detect system dark mode preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(mediaQuery.matches);
    const handler = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);
  
  const navItems = navItemsBase.map(item => ({
    ...item,
    label: t(item.key)
  }));

  useEffect(() => {
    const currentIndex = navItems.findIndex(item => item.name === currentPageName);
    const prevIndex = navItems.findIndex(item => item.name === prevPage);
    if (currentIndex !== -1 && prevIndex !== -1) {
      setDirection(currentIndex > prevIndex ? 1 : -1);
    }
    setPrevPage(currentPageName);
  }, [currentPageName]);



  return (
    <VersionGate>
      <SafeModeProvider>
        <AppStateProvider>
          <AppErrorBoundary>
            <ErrorBoundary screen={currentPageName}>
              <TabErrorBoundary tabName={currentPageName}>
                <MealProvider>
                                {iOSOptimizer()}
                          <div className={`min-h-screen bg-background select-none ${darkMode ? 'dark' : ''}`}>
          <Toaster position="top-center" richColors />
          <PerformanceMonitor />
          
          <React.Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900" />}>
            <motion.main
              key={currentPageName}
              initial={{ opacity: 0.98 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.1 }}
              className={hideNav ? "" : "pb-20"}
              style={{ 
                willChange: 'opacity',
                visibility: isPersistentPage && mountedPages[currentPageName] ? 'visible' : undefined
              }}
            >
              {children}
            </motion.main>
          </React.Suspense>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-4 py-2 z-50 safe-area-inset-bottom">
          <div className="max-w-lg mx-auto flex justify-around items-end" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.name;

              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  onClick={(e) => {
                    if (isActive) {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      return;
                    }

                    // Instant feedback - no debounce for perceived speed
                    if (isNavigating) {
                      e.preventDefault();
                      return;
                    }

                    setIsNavigating(true);
                    setTimeout(() => setIsNavigating(false), 150);
                  }}
                  className="relative flex flex-col items-center py-2 px-4 touch-manipulation transition-transform duration-75 active:scale-90"
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -top-1 w-12 h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 rounded-full"
                      transition={{ type: "spring", stiffness: 600, damping: 35 }}
                    />
                  )}
                  <motion.div
                    className={`p-2.5 rounded-2xl ${
                      isActive ? "bg-gradient-to-br from-teal-500/20 to-emerald-500/20" : ""
                    }`}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: "spring", stiffness: 600, damping: 20 }}
                  >
                    <Icon
                      size={22}
                      className={`transition-colors duration-150 ${
                        isActive ? "text-teal-300" : "text-slate-400"
                      }`}
                    />
                  </motion.div>
                  <motion.span
                    className={`text-[10px] mt-0.5 transition-colors duration-150 font-semibold ${
                      isActive ? "text-teal-300" : "text-slate-500"
                    }`}
                    animate={{ scale: isActive ? 1.05 : 1 }}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              );
            })}
          </div>
        </nav>
        )}
        </div>
              </MealProvider>
              </TabErrorBoundary>
            </ErrorBoundary>
          </AppErrorBoundary>
        </AppStateProvider>
        </SafeModeProvider>
        </VersionGate>
        );
        }