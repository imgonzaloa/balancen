import React from 'react';
import { motion } from 'framer-motion';
import { Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * SafeHome: Minimal static fallback Home page
 * Used during crash stabilization - NO async calls, NO heavy components
 */
export default function SafeHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 p-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)', paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}>
      <div className="max-w-md mx-auto pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center mx-auto border-2 border-white shadow-2xl">
            <span className="text-5xl font-black text-white">B</span>
          </div>
          
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Balancen</h1>
            <p className="text-white/60 text-sm">Welcome back</p>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Safe Mode Active</h2>
            <p className="text-white/70 text-sm">
              Home is temporarily simplified for stability.
              Full features will return once stabilization is complete.
            </p>
          </div>

          <div className="space-y-3 pt-6">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
            >
              Refresh App
            </Button>
            
            <p className="text-white/40 text-xs">
              If issues persist, contact support
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}