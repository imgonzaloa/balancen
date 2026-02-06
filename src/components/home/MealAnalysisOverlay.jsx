import React, { useState } from "react";
import { motion } from "framer-motion";

export default function MealAnalysisOverlay({ imageUrl, items, onItemsChange }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  if (!items || items.length === 0) return null;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-black/80 border border-white/10">
      <img src={imageUrl} alt="Meal" className="w-full h-56 object-cover" />
      
      {/* Ingredient overlay labels */}
      <div className="absolute inset-0 flex flex-wrap content-start gap-2 p-4">
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            layoutId={`item-${idx}`}
            onHoverStart={() => setHoveredItem(idx)}
            onHoverEnd={() => setHoveredItem(null)}
            className={`px-3 py-2 rounded-full text-xs font-bold backdrop-blur-md border transition-all cursor-pointer ${
              hoveredItem === idx
                ? "bg-teal-500/95 border-teal-200 scale-110 shadow-lg"
                : "bg-teal-500/70 border-teal-400/60"
            } text-white`}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">{item.name}</span>
              <span className="text-white/80 text-[11px] font-medium">{item.calories}cal</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gradient overlay bottom */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
    </div>
  );
}