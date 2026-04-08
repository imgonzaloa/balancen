import React from "react";
import { Clock, Sparkles, AlertTriangle, Zap } from "lucide-react";
import { createPageUrl } from "@/utils";

/**
 * Trial banner shown on Home screen.
 * trialDay: current day of trial (1–3)
 * trialDaysLeft: days remaining (3–1)
 */
export default function TrialBanner({ trialDay, trialDaysLeft, lang, navigate }) {
  const isEs = lang === 'es';
  const isNl = lang === 'nl';

  // Message variants by urgency
   const getMessage = () => {
     if (trialDaysLeft === 1) {
       // Day 3 — last day
       return {
         icon: <AlertTriangle size={18} className="text-red-300 flex-shrink-0" />,
         bg: "from-red-500/20 to-orange-500/20",
         border: "border-red-400/50",
         title: isEs ? "⚠️ ¡Último día!" : isNl ? "⚠️ Laatste dag!" : "⚠️ Last day!",
         sub: isEs ? "¡Último día! Tu trial termina hoy" : isNl ? "Laatste dag! Je proefperiode eindigt vandaag" : "Last day! Your trial ends today",
         btnColor: "bg-red-500 hover:bg-red-400",
         btnText: isEs ? "Suscribirse" : isNl ? "Nu abonneren" : "Subscribe Now",
       };
     }
     if (trialDaysLeft === 2) {
       // Day 2 — urgency starts
       return {
         icon: <Clock size={18} className="text-orange-300 flex-shrink-0" />,
         bg: "from-orange-500/20 to-amber-500/20",
         border: "border-orange-400/50",
         title: isEs ? "⏰ Quedan 2 días" : isNl ? "⏰ Nog 2 dagen" : "⏰ 2 days left",
         sub: isEs ? "Quedan 2 días de tu trial" : isNl ? "Nog 2 dagen in je proefperiode" : "2 days left in your trial",
         btnColor: "bg-orange-500 hover:bg-orange-400",
         btnText: isEs ? "Ver planes" : isNl ? "Abonnementen bekijken" : "View Plans",
       };
     }
     if (trialDay >= 2 && trialDaysLeft >= 2) {
        // Day 2+ — urgency phase (changed from trialDay >= 3)
        return {
          icon: <Sparkles size={18} className="text-amber-300 flex-shrink-0" />,
          bg: "from-amber-500/20 to-yellow-500/20",
          border: "border-amber-400/50",
          title: isEs ? `✨ Día ${trialDay} de tu Trial de 3 días` : isNl ? `✨ Dag ${trialDay} van je 3-daagse Trial` : `✨ Day ${trialDay} of your 3-Day Trial`,
          sub: isEs ? "¿Te está gustando? Activa Premium ahora." : isNl ? "Bevalt het je? Activeer Premium nu." : "Enjoying it? Go Premium now.",
          btnColor: "bg-amber-500 hover:bg-amber-400",
          btnText: isEs ? "Ver Premium" : isNl ? "Premium bekijken" : "Go Premium",
        };
      }
     // Default — day 1
     return {
       icon: <Zap size={18} className="text-teal-300 flex-shrink-0" />,
       bg: "from-teal-500/20 to-emerald-500/20",
       border: "border-teal-400/50",
       title: isEs ? `🚀 Día ${trialDay} de 3 — Trial Premium` : isNl ? `🚀 Dag ${trialDay} van 3 — Premium Trial` : `🚀 Day ${trialDay} of 3 — Premium Trial`,
       sub: isEs ? "Acceso completo sin coste. ¡Disfrútalo!" : isNl ? "Volledige toegang zonder kosten. Geniet ervan!" : "Full access, no charge. Enjoy it!",
       btnColor: "bg-teal-600 hover:bg-teal-500",
       btnText: isEs ? "Ver planes" : isNl ? "Abonnementen bekijken" : "View Plans",
     };
   };

  const msg = getMessage();

  return (
    <div className={`bg-gradient-to-r ${msg.bg} backdrop-blur-xl rounded-2xl p-4 border ${msg.border}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{msg.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-snug">{msg.title}</p>
          <p className="text-white/60 text-xs mt-0.5">{msg.sub}</p>
        </div>
        <button
          onClick={() => navigate(createPageUrl('Paywall'))}
          className={`${msg.btnColor} text-white text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0 transition-colors`}
        >
          {msg.btnText}
        </button>
      </div>
    </div>
  );
}