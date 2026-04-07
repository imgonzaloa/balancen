import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ChevronLeft, X, Lock, Sparkles, GitCompare, Grid, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocalDateKey } from "@/lib/utils";
import { toast } from "sonner";

const T = {
  title:        { en: "Progress Photos", es: "Fotos de progreso", nl: "Voortgangsfoto's" },
  add:          { en: "Add photo", es: "Agregar foto", pt: "Adicionar foto" },
  compare:      { en: "Compare", es: "Comparar", pt: "Comparar" },
  gallery:      { en: "Gallery", es: "Galería", pt: "Galeria" },
  weight:       { en: "Weight", es: "Peso", pt: "Peso" },
  note:         { en: "Note", es: "Nota", pt: "Nota" },
  save:         { en: "Save", es: "Guardar", pt: "Salvar" },
  cancel:       { en: "Cancel", es: "Cancelar", pt: "Cancelar" },
  premium:      { en: "Premium only", es: "Solo Premium", nl: "Alleen Premium" },
  select_two:   { en: "Select two photos to compare", es: "Selecciona dos fotos para comparar", pt: "Selecione duas fotos para comparar" },
  weight_diff:  { en: "Weight difference", es: "Diferencia de peso", pt: "Diferença de peso" },
  days_between: { en: "Days between", es: "Días entre fotos", pt: "Dias entre fotos" },
  no_photos:    { en: "No photos yet. Add your first progress photo!", es: "Aún no hay fotos. ¡Agrega tu primera foto de progreso!", pt: "Sem fotos ainda. Adicione sua primeira foto de progresso!" },
  note_ph:      { en: "Optional note...", es: "Nota opcional...", pt: "Nota opcional..." },
  saving:       { en: "Saving...", es: "Guardando...", pt: "Salvando..." },
  upgrade:      { en: "Upgrade to Premium", es: "Actualizar a Premium", pt: "Assinar Premium" },
  unlock_desc:  { en: "Track your visual progress over time with Premium.", es: "Rastrea tu progreso visual con Premium.", pt: "Acompanhe seu progresso visual com Premium." },
};

function tx(key, lang) {
  return T[key]?.[lang] || T[key]?.en || key;
}

export default function ProgressPhotos() {
  const { user, profile } = useAppState();
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const isPremium = profile?.is_premium || profile?.role === "owner" || profile?.role === "collaborator";

  // Form state (after picking photo)
  const [pendingFile, setPendingFile] = useState(null); // { file, dataUrl }
  const [formWeight, setFormWeight] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formDate, setFormDate] = useState(getLocalDateKey());
  const [saving, setSaving] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState("gallery"); // gallery | compare
  const [selectedForCompare, setSelectedForCompare] = useState([]); // up to 2 photo ids
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  // Check if we're coming back from CameraScreen with a captured file
  useEffect(() => {
    const stored = sessionStorage.getItem("progressPhoto_pending");
    if (stored) {
      sessionStorage.removeItem("progressPhoto_pending");
      const parsed = JSON.parse(stored);
      // Reconstruct File from dataUrl
      fetch(parsed.dataUrl)
        .then(r => r.blob())
        .then(blob => {
          const file = new File([blob], "progress.jpg", { type: "image/jpeg" });
          setPendingFile({ file, dataUrl: parsed.dataUrl });
        });
    }
  }, []);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ["bodyPhotos", user?.email],
    queryFn: () => base44.entities.BodyPhoto.filter({ created_by: user.email }, "-date"),
    enabled: !!user?.email && isPremium,
    staleTime: 5 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ file, dataUrl, weight_kg, note, date }) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.entities.BodyPhoto.create({ photo_url: file_url, weight_kg: weight_kg ? parseFloat(weight_kg) : undefined, note, date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bodyPhotos"] });
      setPendingFile(null);
      setFormWeight("");
      setFormNote("");
      setFormDate(getLocalDateKey());
      toast.success(tx("save", lang) + "!");
    },
    onError: () => toast.error(lang === 'es' ? 'Error al guardar foto' : lang === 'nl' ? 'Fout bij opslaan van foto' : 'Error saving photo'),
  });

  const handleSave = async () => {
    if (!pendingFile) return;
    setSaving(true);
    await saveMutation.mutateAsync({ file: pendingFile.file, dataUrl: pendingFile.dataUrl, weight_kg: formWeight, note: formNote, date: formDate });
    setSaving(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPendingFile({ file, dataUrl: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  const openCamera = () => {
    localStorage.setItem("CAMERA_MODE", "progressPhoto");
    navigate(createPageUrl("CameraScreen"));
  };

  const toggleCompareSelect = (id) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  // Premium gate
  if (!isPremium) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-4">
          <Lock size={32} className="text-amber-400" />
        </div>
        <h2 className="text-white text-2xl font-black mb-2">{tx("title", lang)}</h2>
        <p className="text-white/50 text-sm mb-2">{tx("premium", lang)}</p>
        <p className="text-white/40 text-xs mb-8 max-w-xs">{tx("unlock_desc", lang)}</p>
        <Button
          onClick={() => navigate(createPageUrl("Premium"))}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-8 rounded-xl"
        >
          <Sparkles size={16} className="mr-2" />
          {tx("upgrade", lang)}
        </Button>
        <button onClick={() => navigate(-1)} className="mt-4 text-white/40 text-sm">{tx("cancel", lang)}</button>
      </div>
    );
  }

  // Compare logic
  const comparePhotos = selectedForCompare.length === 2
    ? photos.filter(p => selectedForCompare.includes(p.id)).sort((a, b) => a.date.localeCompare(b.date))
    : null;
  const weightDiff = comparePhotos && comparePhotos[0]?.weight_kg && comparePhotos[1]?.weight_kg
    ? (comparePhotos[1].weight_kg - comparePhotos[0].weight_kg).toFixed(1)
    : null;
  const daysDiff = comparePhotos
    ? Math.abs(Math.round((new Date(comparePhotos[1]?.date) - new Date(comparePhotos[0]?.date)) / 86400000))
    : null;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
            <ChevronLeft size={20} className="text-white" />
          </button>
          <h1 className="text-2xl font-black text-white flex-1">{tx("title", lang)}</h1>
          {/* View toggle */}
          <div className="flex bg-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("gallery")}
              className={`p-2 rounded-lg transition-all ${viewMode === "gallery" ? "bg-teal-500 text-white" : "text-white/50"}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => { setViewMode("compare"); setSelectedForCompare([]); }}
              className={`p-2 rounded-lg transition-all ${viewMode === "compare" ? "bg-teal-500 text-white" : "text-white/50"}`}
            >
              <GitCompare size={16} />
            </button>
          </div>
        </div>

        {/* Add photo button */}
        {!pendingFile && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={openCamera}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold shadow-lg"
            >
              <Camera size={18} />
              {tx("add", lang)}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white/60"
            >
              <Upload size={18} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>
        )}

        {/* Pending photo form */}
        <AnimatePresence>
          {pendingFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-800/80 border border-white/10 rounded-2xl p-4 mb-6"
            >
              <div className="flex gap-4">
                <img src={pendingFile.dataUrl} alt="preview" className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                  />
                  <input
                    type="number"
                    value={formWeight}
                    onChange={e => setFormWeight(e.target.value)}
                    placeholder={`${tx("weight", lang)} (kg)`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30"
                  />
                  <input
                    type="text"
                    value={formNote}
                    onChange={e => setFormNote(e.target.value)}
                    placeholder={tx("note_ph", lang)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/30"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setPendingFile(null)}
                  className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-semibold"
                >
                  {tx("cancel", lang)}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold disabled:opacity-50"
                >
                  {saving ? tx("saving", lang) : tx("save", lang)}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compare mode */}
        {viewMode === "compare" && (
          <div className="mb-4">
            <p className="text-white/50 text-sm text-center mb-4">{tx("select_two", lang)}</p>
            {comparePhotos && (
              <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 mb-4">
                <div className="flex gap-3">
                  {comparePhotos.map((p, i) => (
                    <div key={p.id} className="flex-1 text-center">
                      <img src={p.photo_url} alt="compare" className="w-full aspect-[3/4] object-cover rounded-xl mb-2" />
                      <p className="text-white/60 text-xs">{p.date}</p>
                      {p.weight_kg && <p className="text-white font-bold text-sm">{p.weight_kg} kg</p>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-around text-center">
                  {weightDiff !== null && (
                    <div>
                      <p className="text-white/40 text-xs">{tx("weight_diff", lang)}</p>
                      <p className={`font-black text-lg ${parseFloat(weightDiff) < 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {parseFloat(weightDiff) > 0 ? "+" : ""}{weightDiff} kg
                      </p>
                    </div>
                  )}
                  {daysDiff !== null && (
                    <div>
                      <p className="text-white/40 text-xs">{tx("days_between", lang)}</p>
                      <p className="text-white font-black text-lg">{daysDiff}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gallery / photo grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16">
            <Camera size={40} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">{tx("no_photos", lang)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map(photo => {
              const isSelected = selectedForCompare.includes(photo.id);
              return (
                <button
                  key={photo.id}
                  onClick={() => viewMode === "compare" ? toggleCompareSelect(photo.id) : setLightboxPhoto(photo)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    isSelected ? "border-teal-400 scale-95" : "border-transparent"
                  }`}
                >
                  <img src={photo.photo_url} alt={photo.date} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <p className="text-white text-[10px] font-semibold">{photo.date}</p>
                    {photo.weight_kg && <p className="text-teal-300 text-[10px] font-bold">{photo.weight_kg}kg</p>}
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                      <span className="text-white text-[10px] font-black">{selectedForCompare.indexOf(photo.id) + 1}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onClick={() => setLightboxPhoto(null)}
          >
            <button className="absolute top-4 right-4 z-10 p-3 rounded-xl bg-white/10" onClick={() => setLightboxPhoto(null)}>
              <X size={20} className="text-white" />
            </button>
            <img
              src={lightboxPhoto.photo_url}
              alt="progress"
              className="w-full flex-1 object-contain"
              onClick={e => e.stopPropagation()}
            />
            <div className="p-6 text-center" onClick={e => e.stopPropagation()}>
              <p className="text-white/60 text-sm mb-1">{lightboxPhoto.date}</p>
              {lightboxPhoto.weight_kg && (
                <p className="text-white font-black text-2xl mb-1">{lightboxPhoto.weight_kg} kg</p>
              )}
              {lightboxPhoto.note && (
                <p className="text-white/50 text-sm">{lightboxPhoto.note}</p>
              )}
              <button
                onClick={async () => {
                  if (!confirm(lang === 'es' ? '¿Eliminar esta foto?' : lang === 'nl' ? 'Deze foto verwijderen?' : 'Delete this photo?')) return;
                  try {
                    await base44.entities.BodyPhoto.delete(lightboxPhoto.id);
                    queryClient.invalidateQueries({ queryKey: ['bodyPhotos'] });
                    setLightboxPhoto(null);
                  } catch {
                    toast.error(lang === 'es' ? 'Error al eliminar foto' : lang === 'nl' ? 'Fout bij verwijderen van foto' : 'Error deleting photo');
                  }
                }}
                className="mt-4 flex items-center justify-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-colors"
              >
                <Trash2 size={16} />
                {lang === 'es' ? 'Eliminar' : lang === 'nl' ? 'Verwijderen' : 'Delete'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}