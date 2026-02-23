import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, AlertTriangle } from "lucide-react";

export default function AIDisclaimer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900">
      <div className="max-w-lg mx-auto px-4 pb-24 pt-4">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={createPageUrl("Settings")}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Important Notice</h1>
        </div>

        <div className="rounded-3xl p-6 bg-amber-500/10 backdrop-blur-xl border border-amber-400/30 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-amber-300" />
            </div>
            <p className="text-amber-200 font-semibold">AI & Medical Disclaimer</p>
          </div>

          <div className="space-y-4 text-white/80 text-sm leading-relaxed">
            <p>Balancen provides general wellness and fitness insights only.</p>
            <p>It does not replace professional medical, nutritional, or fitness advice.</p>
            <p>Always consult a qualified professional before making significant health decisions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}