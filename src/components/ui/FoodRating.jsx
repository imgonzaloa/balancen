import { motion } from "framer-motion";
import { Smile, Meh, Frown } from "lucide-react";

const ratings = [
  { value: "great", label: "Bien", icon: Smile, color: "bg-emerald-100 text-emerald-600 border-emerald-200", activeColor: "bg-emerald-500 text-white border-emerald-500" },
  { value: "ok", label: "Ok", icon: Meh, color: "bg-amber-100 text-amber-600 border-amber-200", activeColor: "bg-amber-500 text-white border-amber-500" },
  { value: "poor", label: "Mal", icon: Frown, color: "bg-red-100 text-red-500 border-red-200", activeColor: "bg-red-500 text-white border-red-500" },
];

export default function FoodRating({ value, onChange }) {
  return (
    <div className="flex gap-3">
      {ratings.map((rating) => {
        const Icon = rating.icon;
        const isActive = value === rating.value;
        
        return (
          <motion.button
            key={rating.value}
            onClick={() => onChange(rating.value)}
            className={`flex-1 py-4 px-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
              isActive ? rating.activeColor : rating.color
            }`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Icon size={28} />
            <span className="font-medium text-sm">{rating.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}