import { motion } from "framer-motion";
import { Footprints, X } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function MovementToggle({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-3">
      <motion.button
        onClick={() => onChange(true)}
        className={`flex-1 py-5 px-4 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all ${
          value === true
            ? "bg-teal-500 text-white border-teal-500"
            : "bg-teal-50 text-teal-600 border-teal-200"
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Footprints size={24} />
        <span className="font-semibold text-lg">Yes, I moved</span>
      </motion.button>
      
      <motion.button
        onClick={() => onChange(false)}
        className={`py-5 px-6 rounded-2xl border-2 flex items-center justify-center transition-all ${
          value === false
            ? "bg-slate-400 text-white border-slate-400"
            : "bg-slate-100 text-slate-500 border-slate-200"
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <X size={24} />
      </motion.button>
    </div>
  );
}