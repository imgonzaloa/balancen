import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Users, Award, User } from "lucide-react";
import { motion } from "framer-motion";
import { Toaster } from "sonner";

const navItems = [
  { name: "Home", icon: Home, label: "Inicio" },
  { name: "Groups", icon: Users, label: "Grupos" },
  { name: "Badges", icon: Award, label: "Logros" },
  { name: "Profile", icon: User, label: "Perfil" },
];

export default function Layout({ children, currentPageName }) {
  const hideNav = ["Onboarding"].includes(currentPageName);

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors />
      
      <main className={hideNav ? "" : "pb-20"}>
        {children}
      </main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-2 z-50">
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
                      className="absolute -top-1 w-12 h-1 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"
                    />
                  )}
                  <Icon
                    size={24}
                    className={`transition-colors ${
                      isActive ? "text-teal-500" : "text-slate-400"
                    }`}
                  />
                  <span
                    className={`text-xs mt-1 transition-colors ${
                      isActive ? "text-teal-600 font-medium" : "text-slate-400"
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