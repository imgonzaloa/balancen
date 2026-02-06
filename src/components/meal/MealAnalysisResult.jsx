import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MealAnalysisResult({ result, onConfirm, onEdit, onCancel, isLoading }) {
  const [editMode, setEditMode] = useState(false);
  const [calories, setCalories] = useState(result?.estimated_calories || 0);

  const handleConfirm = () => {
    onConfirm({ ...result, estimated_calories: parseInt(calories) });
    setEditMode(false);
  };

  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 rounded-3xl p-6 mb-6 shadow-2xl"
    >
      {/* Detected Food Items */}
      <div className="mb-6">
        <h3 className="text-sm text-white/60 font-medium mb-3">Detected Items</h3>
        <div className="flex flex-wrap gap-2">
          {result.detected_items?.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/50 text-teal-200 text-xs font-medium"
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Calories Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
          <p className="text-white/60 text-xs mb-1 relative z-10">Total Calories</p>
          {editMode ? (
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white font-bold text-2xl"
            />
          ) : (
            <p className="text-3xl font-bold text-orange-300 relative z-10">{calories}</p>
          )}
        </div>

        <div className="rounded-2xl p-4 bg-white/10 border border-white/20">
          <p className="text-white/60 text-xs mb-1">Health Score</p>
          <div className="flex items-end gap-1 h-10">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: i < (result.health_score || 3) ? "100%" : "30%" }}
                transition={{ delay: i * 0.1 }}
                className={`flex-1 rounded-sm ${
                  i < (result.health_score || 3) ? "bg-emerald-400" : "bg-white/20"
                }`}
              />
            ))}
          </div>
          <p className="text-white text-sm font-bold mt-2">{result.health_score || 3}/5</p>
        </div>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/5 rounded-2xl p-3 text-center">
          <p className="text-white/60 text-xs mb-1">Protein</p>
          <p className="text-lg font-bold text-blue-300">{result.estimated_protein || 0}g</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-3 text-center">
          <p className="text-white/60 text-xs mb-1">Carbs</p>
          <p className="text-lg font-bold text-yellow-300">{result.estimated_carbs || 0}g</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-3 text-center">
          <p className="text-white/60 text-xs mb-1">Fats</p>
          <p className="text-lg font-bold text-red-300">{result.estimated_fats || 0}g</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onCancel}
          className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl py-3"
        >
          <X size={18} className="mr-2" />
          Cancel
        </Button>

        {editMode ? (
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl py-3 font-semibold"
          >
            <Check size={18} className="mr-2" />
            Confirm
          </Button>
        ) : (
          <>
            <Button
              onClick={() => setEditMode(true)}
              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl py-3"
            >
              <Edit2 size={18} className="mr-2" />
              Edit
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl py-3 font-semibold"
            >
              <Check size={18} className="mr-2" />
              Confirm
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}