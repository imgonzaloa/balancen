import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft } from "lucide-react";

export default function TermsOfService() {
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
          <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
        </div>

        <div className="rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20 space-y-5 text-white/80 text-sm leading-relaxed">
          <p>Balancen provides AI-powered fitness tracking and general wellness suggestions.</p>

          <p>Balancen does not provide medical, nutritional, or professional fitness advice.</p>

          <div>
            <p className="mb-2 font-semibold text-white">Subscriptions include:</p>
            <ul className="space-y-1 pl-4 list-disc list-inside">
              <li>7-day free trial</li>
              <li>Monthly plan</li>
              <li>Annual plan</li>
            </ul>
          </div>

          <p>Subscriptions renew automatically unless canceled at least 24 hours before the end of the billing period.</p>

          <p>Users may manage or cancel subscriptions in Apple ID settings.</p>

          <p>Balancen is provided "as is" without guarantees of specific results.</p>

          <p className="text-teal-300">Contact: support@balancen.app</p>
        </div>
      </div>
    </div>
  );
}