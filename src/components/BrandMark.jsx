import React from "react";

export default function BrandMark({ size = 20, showText = false, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className="rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center flex-shrink-0"
        style={{ width: size * 1.6, height: size * 1.6 }}
      >
        <span 
          className="font-black text-white" 
          style={{ fontSize: size * 1.2, lineHeight: 1 }}
        >
          B
        </span>
      </div>
      {showText && (
        <span className="text-white font-bold text-sm">Balancen</span>
      )}
    </div>
  );
}