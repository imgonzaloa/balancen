import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, User, Scale, Ruler, LogOut, Save, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import StreakFire from "@/components/ui/StreakFire";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        weight: profile.weight || "",
        height: profile.height || "",
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.UserProfile.update(profile.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["profile"]);
      setEditMode(false);
      toast.success("Perfil actualizado");
    },
  });

  const handleSave = () => {
    const updateData = {
      display_name: formData.display_name,
    };
    if (formData.weight) updateData.weight = parseFloat(formData.weight);
    if (formData.height) updateData.height = parseFloat(formData.height);
    
    updateMutation.mutate(updateData);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const goalLabels = {
    consistency: "Ser más consistente",
    eat_better: "Comer mejor",
    move_more: "Moverme más",
  };

  const intensityLabels = {
    easy: "Fácil",
    normal: "Normal",
    challenging: "Desafiante",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-slate-50 to-slate-50/80 backdrop-blur-sm pt-6 pb-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={createPageUrl("Home")}
                className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center"
              >
                <ChevronLeft size={20} className="text-slate-600" />
              </Link>
              <h1 className="text-xl font-bold text-slate-800">Mi perfil</h1>
            </div>
            {!editMode && (
              <Button
                onClick={() => setEditMode(true)}
                variant="outline"
                className="rounded-xl"
              >
                Editar
              </Button>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
                {profile?.display_name?.charAt(0) || user?.full_name?.charAt(0) || "U"}
              </div>
            </div>
            <div className="flex-1">
              {editMode ? (
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="text-xl font-bold rounded-xl"
                />
              ) : (
                <h2 className="text-xl font-bold text-slate-800">
                  {profile?.display_name || user?.full_name}
                </h2>
              )}
              <p className="text-slate-500">{user?.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-2xl p-4 text-center">
              <StreakFire streak={profile?.current_streak || 0} size="small" />
              <p className="text-xs text-slate-500 mt-2">Racha actual</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-teal-600">{profile?.longest_streak || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Mejor racha</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-700">{profile?.total_checkins || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Check-ins</p>
            </div>
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-semibold text-slate-700 mb-4">Configuración</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Meta principal</span>
              <span className="font-medium text-slate-800">
                {goalLabels[profile?.goal] || "No definida"}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-slate-600">Intensidad</span>
              <span className="font-medium text-slate-800">
                {intensityLabels[profile?.intensity] || "Fácil"}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-slate-600">Modo</span>
              <span className="font-medium text-slate-800">
                {profile?.use_mode === "with_friends" ? "Con amigos" : "Solo"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Optional Data */}
        <motion.div
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold text-slate-700 mb-4">
            Datos opcionales
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-600 flex items-center gap-2 mb-2">
                <Scale size={16} />
                Peso (kg)
              </Label>
              {editMode ? (
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="Opcional"
                  className="rounded-xl"
                />
              ) : (
                <p className="text-slate-800 font-medium">
                  {profile?.weight ? `${profile.weight} kg` : "No definido"}
                </p>
              )}
            </div>
            
            <div>
              <Label className="text-slate-600 flex items-center gap-2 mb-2">
                <Ruler size={16} />
                Altura (cm)
              </Label>
              {editMode ? (
                <Input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="Opcional"
                  className="rounded-xl"
                />
              ) : (
                <p className="text-slate-800 font-medium">
                  {profile?.height ? `${profile.height} cm` : "No definido"}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        {editMode ? (
          <div className="flex gap-3">
            <Button
              onClick={() => setEditMode(false)}
              variant="outline"
              className="flex-1 rounded-xl py-6"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 rounded-xl py-6 bg-teal-500 hover:bg-teal-600"
            >
              <Save size={18} className="mr-2" />
              Guardar
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full rounded-xl py-6 text-red-500 border-red-200 hover:bg-red-50"
          >
            <LogOut size={18} className="mr-2" />
            Cerrar sesión
          </Button>
        )}
      </div>
    </div>
  );
}