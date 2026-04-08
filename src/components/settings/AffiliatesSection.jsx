import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link2, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import CreateAffiliateModal from "./CreateAffiliateModal";
import { toast } from "sonner";

export default function AffiliatesSection({ profile, lang, onProfileUpdated }) {
  const [affiliates, setAffiliates] = useState([]);
  const [conversions, setConversions] = useState({});
  const [revenue, setRevenue] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const labels = {
    es: {
      title: 'Afiliados',
      create: 'Crear código de afiliado',
      affiliate: 'Afiliado',
      code: 'Código',
      conversions: 'Conversiones',
      revenue: 'Ingresos estimados',
      noAffiliates: 'Sin códigos de afiliado aún',
      annual: 'plan anual',
      month: 'mes',
    },
    nl: {
      title: 'Affiliaten',
      create: 'Maak affiliatecode',
      affiliate: 'Affiliate',
      code: 'Code',
      conversions: 'Conversies',
      revenue: 'Geschatte inkomsten',
      noAffiliates: 'Nog geen affiliatecodes',
      annual: 'jaarplan',
      month: 'maand',
    },
    en: {
      title: 'Affiliates',
      create: 'Create Affiliate Code',
      affiliate: 'Affiliate',
      code: 'Code',
      conversions: 'Conversions',
      revenue: 'Estimated Revenue',
      noAffiliates: 'No affiliate codes yet',
      annual: 'annual plan',
      month: 'month',
    },
  };

  const t = labels[lang] || labels.en;

  // Load affiliates from this owner's profile
  useEffect(() => {
    if (!profile?.id) return;
    const fetchData = async () => {
      try {
        // Fetch all user profiles with affiliate codes belonging to this owner
        const allProfiles = await base44.entities.UserProfile.filter({});
        const ownAffiliates = allProfiles.filter(p => 
          p.affiliate_code && p.created_by === profile.created_by
        );
        
        setAffiliates(ownAffiliates);

        // Calculate conversions per affiliate code
        const conversionMap = {};
        const revenueMap = {};

        for (const affiliate of ownAffiliates) {
          // Count users who signed up with this affiliate code
          const converted = await base44.entities.UserProfile.filter({
            referral_source: affiliate.affiliate_code
          });
          
          const count = converted?.length || 0;
          conversionMap[affiliate.affiliate_code] = count;
          
          // Estimate revenue (yearly plan: €99/year ~ €8.25/month per user)
          // Just conversion count × €99 for annual subscriptions
          revenueMap[affiliate.affiliate_code] = count * 99;
        }

        setConversions(conversionMap);
        setRevenue(revenueMap);
      } catch (e) {
        console.error('Error loading affiliates:', e);
      }
    };

    fetchData();
  }, [profile?.id]);

  const handleCreateAffiliate = async (data) => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // Update profile with new affiliate code
      const newProfile = {
        ...profile,
        affiliate_code: data.code,
        display_name: data.name,
      };

      await base44.entities.UserProfile.update(profile.id, newProfile);
      
      // Refresh local state
      const updated = { ...profile, ...newProfile };
      onProfileUpdated(updated);
      setAffiliates(prev => [...prev, updated]);
      setConversions(prev => ({ ...prev, [data.code]: 0 }));
      setRevenue(prev => ({ ...prev, [data.code]: 0 }));
      
      setIsModalOpen(false);
      const msg = lang === 'es' ? 'Código creado' : lang === 'nl' ? 'Code gemaakt' : 'Code created';
      toast.success(msg);
    } catch (e) {
      console.error('Error creating affiliate:', e);
      const msg = lang === 'es' ? 'Error al crear' : lang === 'nl' ? 'Fout bij maken' : 'Error creating code';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="mt-8 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Link2 size={18} className="text-purple-300" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            {t.title}
          </h2>
        </div>

        <div className="space-y-3">
          {/* Create button */}
          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold flex items-center justify-center gap-2 rounded-xl"
          >
            <Plus size={18} />
            {t.create}
          </Button>

          {/* Affiliates list */}
          {affiliates.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
              <p className="text-white/50 text-sm">{t.noAffiliates}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {affiliates.map((affiliate) => (
                <motion.div
                  key={affiliate.affiliate_code}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white font-bold text-sm">{affiliate.display_name}</p>
                      <p className="text-white/50 text-xs font-mono mt-0.5">{affiliate.affiliate_code}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <TrendingUp size={14} className="text-emerald-400" />
                        <span className="text-emerald-300 font-bold text-sm">
                          {conversions[affiliate.affiliate_code] || 0}
                        </span>
                      </div>
                      <p className="text-white/40 text-xs">{t.conversions}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                    <p className="text-white/40 text-xs">{t.revenue}</p>
                    <p className="text-purple-300 font-bold text-sm">
                      €{(revenue[affiliate.affiliate_code] || 0).toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <CreateAffiliateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateAffiliate}
        lang={lang}
      />
    </>
  );
}