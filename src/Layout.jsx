import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Users, Award, User } from "lucide-react";
import { motion } from "framer-motion";
import { Toaster } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";

const navItemsBase = [
  { name: "Home", icon: Home, key: "home" },
  { name: "Groups", icon: Users, key: "groups" },
  { name: "Badges", icon: Award, key: "badges" },
  { name: "Profile", icon: User, key: "profile" },
];

export default function Layout({ children, currentPageName }) {
  const hideNav = ["Onboarding"].includes(currentPageName);
  const { t } = useTranslation();
  
  const navItems = navItemsBase.map(item => ({
    ...item,
    label: t(item.key)
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors />
      
      <main className={hideNav ? "" : "pb-20"}>
        {children}
      </main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-2xl border-t border-white/10 px-4 py-3 z-50">
          <div className="max-w-lg mx-auto flex justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.name;

              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  className="relative flex flex-col items-center py-2 px-4"
                >
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -top-2 w-14 h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 rounded-full shadow-lg shadow-teal-500/50"
                    />
                  )}
                  <motion.div
                    className={`p-2 rounded-2xl transition-all ${
                      isActive ? "bg-gradient-to-br from-teal-500/20 to-emerald-500/20" : ""
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon
                      size={24}
                      className={`transition-colors ${
                        isActive ? "text-teal-300" : "text-slate-400"
                      }`}
                    />
                  </motion.div>
                  <span
                    className={`text-xs mt-1 transition-colors font-medium ${
                      isActive ? "text-teal-300" : "text-slate-500"
                    }`}
                  >
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