import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { ArrowLeft, Camera, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ProgressTracker() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAppState();
  const { t, lang } = useTranslation();
  const [showAddSnapshot, setShowAddSnapshot] = useState(false);

  const [snapshotData, setSnapshotData] = useState({
    weight: "",
    body_fat_percentage: "",
    muscle_mass: "",
    measurements: { chest: "", waist: "", hips: "", arms: "", thighs: "" },
    mood: "neutral",
    energy_level: 5,
    notes: "",
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ["progress-snapshots", user?.email],
    queryFn: () => base44.entities.ProgressSnapshot.filter({ created_by: user.email }, "-date"),
    enabled: !!user?.email,
  });

  const addSnapshotMutation = useMutation({
    mutationFn: (data) => base44.entities.ProgressSnapshot.create({
      ...data,
      date: new Date().toISOString().split("T")[0],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress-snapshots"] });
      toast.success(t('progress_saved') || "Progress saved!");
      setShowAddSnapshot(false);
      setSnapshotData({
        weight: "",
        body_fat_percentage: "",
        muscle_mass: "",
        measurements: { chest: "", waist: "", hips: "", arms: "", thighs: "" },
        mood: "neutral",
        energy_level: 5,
        notes: "",
      });
    },
  });

  const weightData = snapshots
    .filter(s => s.weight)
    .map(s => ({ date: new Date(s.date).toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US', { day: "2-digit", month: "short" }), weight: s.weight }))
    .reverse();

  const latestSnapshot = snapshots[0];
  const previousSnapshot = snapshots[1];

  const weightChange = latestSnapshot && previousSnapshot 
    ? latestSnapshot.weight - previousSnapshot.weight 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(createPageUrl('Progress'))}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">{t('advanced_tracking') || 'Advanced Tracking'}</h1>
            <p className="text-white/60 text-sm">{t('monitor_progress') || 'Monitor your complete progress'}</p>
          </div>
        </div>

        {/* Current Stats */}
        {latestSnapshot && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-xs mb-1">{t('current_weight') || 'Current Weight'}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-white text-3xl font-bold">{latestSnapshot.weight}</p>
                  <span className="text-white/70 text-sm">kg</span>
                  {weightChange !== 0 && (
                    <span className={`text-xs flex items-center gap-1 ${weightChange < 0 ? 'text-green-400' : 'text-orange-400'}`}>
                      {weightChange < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                      {Math.abs(weightChange).toFixed(1)} kg
                    </span>
                  )}
                </div>
              </div>
              {latestSnapshot.body_fat_percentage && (
                <div>
                  <p className="text-white/60 text-xs mb-1">{t('body_fat') || 'Body Fat'}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-white text-3xl font-bold">{latestSnapshot.body_fat_percentage}</p>
                    <span className="text-white/70 text-sm">%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weight Chart */}
        {weightData.length > 1 && (
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6">
            <h3 className="text-white font-bold mb-4">{t('weight_evolution') || 'Weight Evolution'}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" style={{ fontSize: 12 }} />
                <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px" }}
                  labelStyle={{ color: "white" }}
                />
                <Line type="monotone" dataKey="weight" stroke="#14b8a6" strokeWidth={3} dot={{ fill: "#14b8a6", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Add Snapshot Button */}
        <Button
           onClick={() => setShowAddSnapshot(true)}
           className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-6 mb-6"
         >
           <Plus size={20} className="mr-2" />
           {t('add_measurement') || 'Add Measurement'}
         </Button>

        {/* History */}
        <div className="space-y-3">
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
              <div className="flex items-start justify-between mb-2">
                <p className="text-white font-bold">{new Date(snapshot.date).toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US', { day: "numeric", month: "long", year: "numeric" })}</p>
                <span className="text-white/60 text-xs">{snapshot.mood}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {snapshot.weight && <div><span className="text-white/60">{t('weight')}:</span> <span className="text-white font-semibold">{snapshot.weight} kg</span></div>}
                {snapshot.body_fat_percentage && <div><span className="text-white/60">{t('fat')}:</span> <span className="text-white font-semibold">{snapshot.body_fat_percentage}%</span></div>}
                {snapshot.muscle_mass && <div><span className="text-white/60">{t('muscle')}:</span> <span className="text-white font-semibold">{snapshot.muscle_mass} kg</span></div>}
              </div>
              {snapshot.notes && <p className="text-white/70 text-xs mt-2">{snapshot.notes}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Add Snapshot Modal */}
      {showAddSnapshot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-slate-900 rounded-t-3xl w-full max-h-[85vh] overflow-y-auto p-6">
            <h2 className="text-white font-bold text-xl mb-4">{t('new_measurement') || 'New Measurement'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-white/70 text-sm mb-1 block">{t('weight_kg') || 'Weight (kg)'}</label>
                <Input
                  type="number"
                  step="0.1"
                  value={snapshotData.weight}
                  onChange={(e) => setSnapshotData({ ...snapshotData, weight: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">{t('body_fat_percent') || 'Body Fat (%)'}</label>
                <Input
                  type="number"
                  step="0.1"
                  value={snapshotData.body_fat_percentage}
                  onChange={(e) => setSnapshotData({ ...snapshotData, body_fat_percentage: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-1 block">{t('notes')}</label>
                <Input
                  value={snapshotData.notes}
                  onChange={(e) => setSnapshotData({ ...snapshotData, notes: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder={t('how_feeling_today') || "How are you feeling today?"}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddSnapshot(false)}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={() => addSnapshotMutation.mutate({
                    weight: snapshotData.weight ? parseFloat(snapshotData.weight) : undefined,
                    body_fat_percentage: snapshotData.body_fat_percentage ? parseFloat(snapshotData.body_fat_percentage) : undefined,
                    notes: snapshotData.notes || undefined,
                    mood: snapshotData.mood,
                    energy_level: snapshotData.energy_level,
                  })}
                  disabled={!snapshotData.weight && !snapshotData.body_fat_percentage}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500"
                >
                  {t('save')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}