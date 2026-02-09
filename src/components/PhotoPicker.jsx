import React, { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/TranslationProvider";

export default function PhotoPicker({ onPhotoSelected, preview, onRemovePreview }) {
  const { t } = useTranslation();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);

  const handleGallerySelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onPhotoSelected(file, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
          const reader = new FileReader();
          reader.onloadend = () => {
            onPhotoSelected(file, reader.result);
            stopCamera();
          };
          reader.readAsDataURL(file);
        }
      }, "image/jpeg");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  if (showCamera) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full rounded-lg mb-4 bg-black"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex gap-2">
           <Button
             onClick={stopCamera}
             variant="outline"
             className="flex-1"
           >
             {t('cancel')}
           </Button>
           <Button
             onClick={capturePhoto}
             className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold"
           >
             {t('take_photo')}
           </Button>
         </div>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
        <img src={preview} alt="Preview" className="w-full rounded-lg mb-3" />
        <Button
           onClick={onRemovePreview}
           variant="outline"
           className="w-full text-red-300 border-red-300/30 hover:bg-red-500/10"
         >
           <X size={18} className="mr-2" />
           {t('delete')}
         </Button>
      </div>
    );
  }

  return (
     <div className="flex gap-2">
       <Button
         onClick={startCamera}
         className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white"
       >
         <Camera size={18} className="mr-2" />
         {t('take_photo')}
       </Button>
       <Button
         onClick={() => galleryRef.current?.click()}
         className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white"
       >
         <Upload size={18} className="mr-2" />
         {t('choose_gallery')}
       </Button>
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={handleGallerySelect}
        className="hidden"
      />
    </div>
  );
}