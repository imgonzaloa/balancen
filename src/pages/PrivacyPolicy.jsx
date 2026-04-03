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

        <div className="rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20 space-y-6 text-white/80 text-sm leading-relaxed">
          
          {/* 1. Data We Collect */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">1. Data We Collect</h2>
            <div className="space-y-2">
              <p><strong>Account Information:</strong> Email address, display name, password hash, and authentication tokens.</p>
              <p><strong>Food Photos:</strong> Images you upload for meal tracking and calorie estimation.</p>
              <p><strong>Meal Logs:</strong> Food descriptions, timestamps, estimated calories, protein, carbs, and fats.</p>
              <p><strong>Fitness Data:</strong> Workout logs, exercise types, duration, and intensity levels you record.</p>
              <p><strong>Body Metrics:</strong> Height, weight, age, gender, and activity level you provide during onboarding.</p>
              <p><strong>Streak & Progress Data:</strong> Daily check-in records, consistency metrics, badges earned, and historical progress snapshots.</p>
              <p><strong>Device Information:</strong> Device type, OS version, app version, and anonymized usage patterns to improve app stability.</p>
              <p><strong>Subscription Data:</strong> Billing information (processed securely via Stripe), subscription status, and trial dates.</p>
            </div>
          </div>

          {/* 2. How We Use Your Data */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Data</h2>
            <div className="space-y-2">
              <p><strong>AI Meal Analysis:</strong> Food photos are securely transmitted to third-party AI providers to generate nutritional estimates and provide personalized meal insights.</p>
              <p><strong>Personalization:</strong> We use your fitness data, goals, and preferences to generate customized workout and meal plans, and to provide relevant health recommendations.</p>
              <p><strong>Streak Tracking & Gamification:</strong> We track your daily check-ins to maintain accuracy in streak counts, badges, and achievement records.</p>
              <p><strong>Analytics & Improvement:</strong> We analyze usage patterns (anonymized) to improve app performance, fix bugs, and enhance features.</p>
              <p><strong>Account Management:</strong> We use your email for account recovery, subscription notifications, and important service updates.</p>
            </div>
          </div>

          {/* 3. Data Sharing & Third Parties */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">3. Data Sharing & Third Parties</h2>
            <div className="space-y-2">
              <p><strong>Base44 Infrastructure:</strong> Your data is hosted on Base44's secure cloud infrastructure to provide reliable service and backup.</p>
              <p><strong>AI Service Providers:</strong> Food photos and meal descriptions are sent to third-party AI providers (e.g., vision and language models) to estimate nutritional content. These providers are contractually obligated to protect your data and not use it for other purposes.</p>
              <p><strong>Stripe Payment Processing:</strong> Payment information is handled securely by Stripe and is not stored on our servers.</p>
              <p><strong>No Data Sales:</strong> We do not sell, trade, or rent your personal data to third parties. We do not share your data for marketing purposes without your explicit consent.</p>
              <p><strong>Legal Compliance:</strong> We may disclose data when required by law or to protect the safety and rights of our users and platform.</p>
            </div>
          </div>

          {/* 4. Data Retention */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">4. Data Retention</h2>
            <p>Your data is retained while your account is active. Upon account deletion (Profile → Settings → Delete Account), all personal data including photos, meal logs, fitness records, and account information will be permanently removed from our systems within 30 days. Some data may remain in backup systems for compliance purposes but will not be accessible.</p>
          </div>

          {/* 5. Your Rights */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">5. Your Rights</h2>
            <div className="space-y-2">
              <p><strong>Access:</strong> You can access and download your data at any time through the app (Profile → Settings).</p>
              <p><strong>Correction:</strong> You can update your account information and fitness metrics directly in the app.</p>
              <p><strong>Deletion:</strong> You can delete your account and all associated data at any time.</p>
              <p><strong>Data Portability:</strong> You can request a copy of your data in a portable format.</p>
              <p>To exercise these rights, email <strong>hello@balancen.app</strong> with your request.</p>
            </div>
          </div>

          {/* 6. GDPR Rights (EU Users) */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">6. GDPR Rights for EU Users</h2>
            <div className="space-y-2">
              <p>If you are located in the European Union, you have additional rights under GDPR:</p>
              <ul className="space-y-1 pl-4 list-disc list-inside">
                <li>Right to access your personal data</li>
                <li>Right to rectification (correction) of inaccurate data</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
                <li>Right to lodge a complaint with your local data protection authority</li>
              </ul>
              <p className="mt-2">We process your data on the basis of your consent and our legitimate interest in providing and improving the service. You can withdraw consent at any time by deleting your account.</p>
            </div>
          </div>

          {/* 7. Children Under 13 */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">7. Children Under 13</h2>
            <p>Balancen is not intended for users under 13 years of age. We do not knowingly collect personal data from children under 13. If we become aware that a child under 13 has created an account, we will delete the account and all associated data immediately. Parents or guardians who believe their child has provided data should contact us at <strong>hello@balancen.app</strong>.</p>
          </div>

          {/* 8. Security */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">8. Security</h2>
            <p>We implement industry-standard security measures including encryption, secure authentication, and regular security audits to protect your data. However, no system is 100% secure. If you suspect a data breach, please contact us immediately.</p>
          </div>

          {/* 9. Changes to This Policy */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or within the app. Your continued use of Balancen after changes constitutes acceptance of the updated policy.</p>
          </div>

          {/* Contact */}
          <div className="bg-teal-500/20 border border-teal-500/40 rounded-xl p-4 mt-6">
            <p className="text-teal-300 font-semibold mb-2">Questions or Concerns?</p>
            <p>If you have questions about this Privacy Policy or our data practices, please contact us at:</p>
            <p className="text-teal-300 font-semibold mt-2">hello@balancen.app</p>
            <p className="text-xs text-white/60 mt-2">Last updated: April 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}