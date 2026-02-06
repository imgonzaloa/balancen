import React, { useState } from "react";
import { motion } from "framer-motion";

export default function MealAnalysisOverlay({ imageUrl, items, onItemsChange }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  if (!items || items.length === 0) return null;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black/50">
      <img src={imageUrl} alt="Meal" className="w-full h-48 object-cover" />
      
      {/* Ingredient overlay labels */}
      <div className="absolute inset-0 flex flex-wrap content-start gap-2 p-3">
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            layoutId={`item-${idx}`}
            onHoverStart={() => setHoveredItem(idx)}
            onHoverEnd={() => setHoveredItem(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border transition-all cursor-pointer ${
              hoveredItem === idx
                ? "bg-teal-500/90 border-teal-300 scale-110 shadow-lg"
                : "bg-teal-500/60 border-teal-400/50"
            } text-white`}
          >
            <div className="flex items-center gap-1">
              <span>{item.name}</span>
              <span className="text-white/70 text-[10px]">{item.calories}cal</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gradient overlay bottom */}
      <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );
}