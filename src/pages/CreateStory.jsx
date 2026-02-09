import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/components/AppStateContext";
import { ArrowLeft, Camera, Upload, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

export default function CreateStory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile } = useAppState();
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const createStoryMutation = useMutation({
    mutationFn: async (storyData) => base44.entities.Story.create(storyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-stories"] });
      toast.success("¡Historia publicada!");
      navigate(createPageUrl('Social'));
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
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
            <Camera size={48} className="text-white/50" />
          </div>
          <p className="text-white/70 text-center">Selecciona una foto para tu historia</p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-6"
            >
              <Upload size={20} className="mr-2" />
              Subir desde Galería
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
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