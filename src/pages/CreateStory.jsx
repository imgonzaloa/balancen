import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { ArrowLeft, Send, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import PhotoPicker from "@/components/PhotoPicker";

export default function CreateStory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAppState();
  const { t } = useTranslation();
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isPremium = profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator';

  const createStoryMutation = useMutation({
    mutationFn: async (storyData) => base44.entities.Story.create(storyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-stories"] });
      toast.success("¡Historia publicada!");
      navigate(createPageUrl('Social'));
    },
  });

  const handlePhotoSelected = (file, photoPreview) => {
    setSelectedFile(file);
    setPreview(photoPreview);
  };

  const handlePublish = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await createStoryMutation.mutateAsync({
        user_email: user.email,
        user_name: profile?.display_name || user.email,
        user_avatar: profile?.avatar_url,
        media_url: file_url,
        media_type: "image",
        caption: caption.trim() || undefined,
        expires_at: expiresAt.toISOString(),
        views: [],
      });
    } catch (error) {
      toast.error("Error al publicar historia");
    } finally {
      setUploading(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
          <Lock size={40} className="text-purple-400" />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Función Premium</h2>
        <p className="text-white/70 text-center mb-8">Las historias están disponibles solo para miembros Premium</p>
        <Button
          onClick={() => navigate(createPageUrl('Premium'))}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-3"
        >
          Upgrade a Premium
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => navigate(createPageUrl('Social'))}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-white font-bold text-lg">Nueva Historia</h1>
        <div className="w-10" />
      </div>

      {!preview ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-xl border-2 border-dashed border-white/30 flex items-center justify-center">
            <span className="text-4xl">📸</span>
          </div>
          <p className="text-white/70 text-center">Selecciona una foto para tu historia</p>
          <PhotoPicker
            onPhotoSelected={handlePhotoSelected}
            preview={preview}
            onRemovePreview={() => setPreview(null)}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
          </div>
          
          <div className="p-4 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 space-y-3">
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Añade un texto..."
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                  setCaption("");
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePublish}
                disabled={uploading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} className="mr-2" />
                    Publicar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}