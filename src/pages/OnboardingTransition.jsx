import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";
import { getLocalLanguage } from "@/lib/language";

export default function OnboardingTransition() {
  const lang = useMemo(() => getLocalLanguage(), []);
  
  const messages = {
    en: { title: 'Setting up your experience...', subtitle: 'Get ready to start your journey' },
    es: { title: 'Preparando tu experiencia...', subtitle: 'Listo para empezar tu camino' },
    pt: { title: 'Preparando sua experiência...', subtitle: 'Pronto para começar sua jornada' }
  };
  
  const { title, subtitle } = messages[lang] || messages.en;
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = createPageUrl("Home");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center relative z-10"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="flex justify-center mb-6"
        >
          <Loader2 size={48} className="text-teal-300" />
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-2">
          {title}
        </h1>
        <p className="text-teal-200">{subtitle}</p>
      </motion.div>
    </div>
  );
}