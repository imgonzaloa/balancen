import { Link, useLocation, useNavigate } from "react-router-dom";
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
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import { useBootSequence } from "@/components/BootSequence";
import BootSplash from "@/components/BootSplash";
import { SafeBootManager } from "@/components/SafeBootManager";

const navItemsBase = [
  { name: "Home", icon: Home, key: "home" },
  { name: "Social", icon: Users, key: "social" },
  { name: "Progress", icon: Award, key: "progress" },
  { name: "Profile", icon: User, key: "profile" },
];

// Persistent tab containers
const persistentPages = ["Home", "Social", "Progress", "Profile"];

// Pages that should not show nav (no bottom bar)
const noNavPages = ["Onboarding", "Paywall", "CameraScreen", "MealResult", "LanguageSelector"];

export default function Layout({ children, currentPageName }) {
    // CRITICAL: ALL hooks must be called unconditionally BEFORE any returns
    const navigate = useNavigate();
    const bootState = useBootSequence();
    const { t, lang, changeLanguage } = useTranslation();
    const [direction, setDirection] = useState(0);
    const [prevPage, setPrevPage] = useState(currentPageName);
    const [isNavigating, setIsNavigating] = useState(false);
    const [mountedPages, setMountedPages] = useState({});
    const [darkMode, setDarkMode] = useState(false);
    const [routingComplete, setRoutingComplete] = useState(false);

  const hideNav = noNavPages.includes(currentPageName);
  const isPersistentPage = persistentPages.includes(currentPageName);
  
  // Keep tabs mounted for instant switching
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

  // Routing logic (run once when boot is ready)
  useEffect(() => {
    if (bootState.stage !== 'READY' || routingComplete) return;

    // Sync language
    if (bootState.language && lang !== bootState.language) {
      changeLanguage(bootState.language);
    }

    // Route enforcement: no loops, no flashing
    let shouldRoute = false;
    let targetPage = null;

    if (!bootState.isAuthenticated) {
      if (currentPageName !== 'Home') {
        targetPage = 'Home';
        shouldRoute = true;
      }
    } else if (!bootState.language) {
      if (currentPageName !== 'LanguageSelector') {
        targetPage = 'LanguageSelector';
        shouldRoute = true;
      }
    } else if (!bootState.onboardingCompleted) {
      if (currentPageName !== 'Onboarding') {
        targetPage = 'Onboarding';
        shouldRoute = true;
      }
    } else {
      if (['Onboarding', 'LanguageSelector'].includes(currentPageName)) {
        targetPage = 'Home';
        shouldRoute = true;
      }
    }

    if (shouldRoute && targetPage) {
      setTimeout(() => {
        if (targetPage === 'Home') {
          window.location.href = '/';
        } else {
          navigate(createPageUrl(targetPage), { replace: true });
        }
        setRoutingComplete(true);
      }, 0);
    } else {
      setRoutingComplete(true);
    }
  }, [bootState.stage, bootState.isAuthenticated, bootState.language, bootState.onboardingCompleted, currentPageName, routingComplete, lang, changeLanguage, navigate]);

  // Show splash while booting (AFTER all hooks)
  if (bootState.stage !== 'READY') {
    return (
      <GlobalErrorBoundary>
        <VersionGate>
          <BootSplash stage={bootState.stage} safeMode={bootState.safeMode} />
        </VersionGate>
      </GlobalErrorBoundary>
    );
  }

  // Render app after boot complete
  return (
    <GlobalErrorBoundary>
      <VersionGate>
        <SafeModeProvider>
          <AppStateProvider>
            {bootState.safeMode && (
              <div className="fixed top-0 left-0 right-0 bg-amber-500/90 text-white text-center py-1 text-xs z-50" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.25rem)' }}>
                ⚠️ Safe Mode Active
              </div>
            )}
            {renderApp()}
          </AppStateProvider>
        </SafeModeProvider>
      </VersionGate>
    </GlobalErrorBoundary>
  );
}