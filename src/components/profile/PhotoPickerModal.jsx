import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { Button } from '@/components/ui/button';
import OverlayPortal from '@/components/OverlayPortal';

export default function PhotoPickerModal({ isOpen, onClose, onSelectFile }) {
  const { t, lang } = useTranslation();
  const galleryInput = useRef(null);
  const cameraInput = useRef(null);

  const handleGalleryClick = () => galleryInput.current?.click();
  const handleCameraClick = () => cameraInput.current?.click();

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
      onClose();
    }
  };

  return (
    <OverlayPortal>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                touchAction: 'none',
                pointerEvents: 'auto',
                zIndex: 50001,
              }}
            />
            {/* Sheet — sits above bottom nav */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0, right: 0,
                zIndex: 9999,
                maxHeight: '90dvh',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                background: '#0f172a',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px 24px 0 0',
                paddingTop: '24px',
                paddingLeft: '24px',
                paddingRight: '24px',
                paddingBottom: '88px',
                touchAction: 'pan-y',
                pointerEvents: 'auto',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  {lang === 'es' ? 'Elegir foto' : 'Choose photo'}
                </h3>
                <button
                  onClick={onClose}
                  style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white/60" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleGalleryClick}
                  style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-4 active:scale-[0.98]"
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
                  style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                  className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-4 active:scale-[0.98]"
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
                  style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                  className="w-full h-12 border-white/20 text-white hover:bg-white/10 rounded-xl"
                >
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
              </div>

              <input ref={galleryInput} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" aria-label="Gallery input" />
              <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" aria-label="Camera input" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </OverlayPortal>
  );
}