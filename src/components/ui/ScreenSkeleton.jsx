import React from "react";
import { motion } from "framer-motion";

export function CardSkeleton({ className = "" }) {
  return (
    <div className={`bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 ${className}`}>
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-white/10 rounded w-1/3" />
        <div className="h-8 bg-white/10 rounded w-2/3" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
      </div>
    </div>
  );
}

export function RingSkeleton() {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
      <div className="flex items-center gap-6">
        <div className="relative w-40 h-40 rounded-full bg-white/5 animate-pulse" />
        <div className="flex-1 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
      <div className="max-w-lg mx-auto px-4 pb-24 pt-6 relative z-10 space-y-6">
        {/* Header skeleton */}
        <div className="text-center space-y-2 animate-pulse">
          <div className="h-3 bg-white/10 rounded w-32 mx-auto" />
          <div className="h-10 bg-white/20 rounded-lg w-48 mx-auto" />
        </div>
        
        {/* Hero card skeleton */}
        <div className="bg-white/10 rounded-3xl p-6 h-48 animate-pulse" />
        
        {/* Ring skeleton */}
        <RingSkeleton />
        
        {/* Cards */}
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton className="h-32" />
      </div>
    </div>
  );
}

export function SocialSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 pb-24">
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <div className="h-8 bg-white/10 rounded w-48 animate-pulse mb-6" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/5 rounded-2xl p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="flex-1">
                <div className="h-4 bg-white/10 rounded w-24 mb-2" />
                <div className="h-3 bg-white/10 rounded w-32" />
              </div>
            </div>
            <div className="h-48 bg-white/10 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 pb-24">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="h-8 bg-white/10 rounded w-48 animate-pulse mb-6" />
        <div className="bg-white/10 rounded-3xl p-6 h-40 animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-white/10 rounded-2xl animate-pulse" />
          <div className="h-48 bg-white/10 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}