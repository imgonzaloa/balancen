import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { Button } from '@/components/ui/button';

export default function PhotoPickerModal({ isOpen, onClose, onSelectFile }) {
  const { t, lang } = useTranslation();
  const galleryInput = useRef(null);
  const cameraInput = useRef(null);

  const handleGalleryClick = () => {
    if (galleryInput.current) {
      galleryInput.current.click();
    }
  };

  const handleCameraClick = () => {
    if (cameraInput.current) {
      cameraInput.current.click();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl border-t border-white/10 z-50 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {lang === 'es' ? 'Elegir foto' : 'Choose photo'}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} className="text-white/60" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGalleryClick}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <ImageIcon size={24} className="text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">
                    {lang === 'es' ? 'Galería' : 'Photos'}
                  </p>
                  <p className="text-white/60 text-sm">
                    {lang === 'es' ? 'Seleccionar de la galería' : 'Choose from library'}
                  </p>
                </div>
              </button>

              <button
                onClick={handleCameraClick}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Camera size={24} className="text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">
                    {lang === 'es' ? 'Cámara' : 'Camera'}
                  </p>
                  <p className="text-white/60 text-sm">
                    {lang === 'es' ? 'Tomar una foto ahora' : 'Take a photo now'}
                  </p>
                </div>
              </button>

              <Button
                onClick={onClose}
                variant="outline"
                className="w-full h-12 border-white/20 text-white hover:bg-white/10 rounded-xl"
              >
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
            </div>

            <input
              ref={galleryInput}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Gallery input"
            />

            <input
              ref={cameraInput}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Camera input"
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}