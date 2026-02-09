import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Users, Award, User } from "lucide-react";
import { Toaster } from "sonner";
import { TranslationProvider, useTranslation } from "@/components/TranslationProvider";
import { MealProvider } from "@/components/MealContext";
import { AppStateProvider } from "@/components/AppStateContext";
import BootGate from "@/components/BootGate";
import VersionGate from "@/components/VersionGate";
import ErrorBoundary from "@/components/ErrorBoundary";
import BrandMark from "@/components/BrandMark";

const navItems = [
  { name: "Home", icon: Home, label: "Home" },
  { name: "Social", icon: Users, label: "Social" },
  { name: "Progress", icon: Award, label: "Progress" },
  { name: "Profile", icon: User, label: "Profile" }
];

const noNavPages = ["Onboarding", "Paywall", "CameraScreen", "MealResult", "LanguageSelector"];
const showBrandPages = ["Home", "Social", "Progress", "Profile"];

function LayoutInner({ children, currentPageName, bootState }) {
  const navigate = useNavigate();
  const { t, lang, changeLanguage } = useTranslation();
  
  // ALL HOOKS UNCONDITIONALLY AT TOP
  const hideNav = noNavPages.includes(currentPageName);
  const isActive = (pageName) => currentPageName === pageName;

  // ROUTING LOGIC (after hooks, based on boot state)
  React.useEffect(() => {
    if (!bootState) return;

    if (bootState.type === 'AUTH_REQUIRED') {
      // Not logged in - stay on home (login page)
      if (currentPageName !== 'Home') {
        navigate(createPageUrl('Home'), { replace: true });
      }
      return;
    }

    if (bootState.type === 'LANGUAGE_SELECTION') {
      if (currentPageName !== 'LanguageSelector') {
        navigate(createPageUrl('LanguageSelector'), { replace: true });
      }
      return;
    }

    if (bootState.type === 'ONBOARDING_REQUIRED') {
      if (currentPageName !== 'Onboarding') {
        navigate(createPageUrl('Onboarding'), { replace: true });
      }
      return;
    }

    if (bootState.type === 'HOME_READY') {
      // Sync language ONCE on boot
      if (bootState.language && lang !== bootState.language) {
        changeLanguage(bootState.language).catch(() => {
          // Fallback if language change fails
          console.warn('Language change failed, using default');
        });
      }
      
      // Redirect away from onboarding/language if somehow still there
      if (['Onboarding', 'LanguageSelector'].includes(currentPageName)) {
        navigate(createPageUrl('Home'), { replace: true });
      }
    }
  }, [bootState?.type, currentPageName]);

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
      
      <main className={hideNav ? "" : "pb-20"} style={{ paddingTop: showBrandPages.includes(currentPageName) ? '60px' : '0' }}>
        {children}
      </main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
          <div className="max-w-lg mx-auto flex justify-around items-center py-2 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.name);
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  className="relative flex flex-col items-center py-2 px-4 touch-manipulation transition-transform duration-75 active:scale-90"
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

export default function Layout({ children, currentPageName }) {
  return (
    <VersionGate>
      <ErrorBoundary screen="Layout">
        <BootGate>
          {({ bootState }) => (
            <TranslationProvider>
              <AppStateProvider>
                <MealProvider>
                  <LayoutInner currentPageName={currentPageName} bootState={bootState}>
                    {children}
                  </LayoutInner>
                </MealProvider>
              </AppStateProvider>
            </TranslationProvider>
          )}
        </BootGate>
      </ErrorBoundary>
    </VersionGate>
  );
}