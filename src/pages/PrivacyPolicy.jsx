import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
          <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
        </div>

        <div className="rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20 space-y-5 text-white/80 text-sm leading-relaxed">
          <p>Balancen collects account information (email, display name), user-generated content (food photos, workout logs), and fitness data entered by the user.</p>

          <p>Food images may be processed by secure third-party AI providers to estimate nutritional data.</p>

          <p>User data may be stored securely on cloud infrastructure providers.</p>

          <p>We do not sell personal data.</p>

          <p>Users can delete their account at any time from Profile → Settings → Delete Account. Upon deletion, associated personal data will be removed.</p>

          <p>Balancen is not intended for users under 13 years of age.</p>

          <p className="text-teal-300">Contact: support@balancen.app</p>
        </div>
      </div>
    </div>
  );
}