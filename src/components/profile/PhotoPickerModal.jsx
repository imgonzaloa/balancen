import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { Button } from '@/components/ui/button';

export default function PhotoPickerModal({ isOpen, onClose, onSelectFile }) {
  const { lang } = useTranslation();
  const galleryInput = useRef(null);
  const cameraInput = useRef(null);

  // Prevent background scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleGalleryClick = () => galleryInput.current?.click();
  const handleCameraClick = () => cameraInput.current?.click();

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
      onClose();
    }
  };

  return ReactDOM.createPortal(
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
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 999998,
              touchAction: 'none',
              pointerEvents: 'auto',
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 999999,
              background: '#0f172a',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px 24px 0 0',
              paddingTop: '24px',
              paddingLeft: '24px',
              paddingRight: '24px',
              paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px) + 16px)',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              pointerEvents: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>
                {lang === 'es' ? 'Elegir foto' : 'Choose photo'}
              </h3>
              <button
                onClick={onClose}
                style={{ padding: '8px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation' }}
              >
                <X size={20} color="rgba(255,255,255,0.6)" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleGalleryClick}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ImageIcon size={24} color="#34d399" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{lang === 'es' ? 'Galería' : 'Photos'}</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>{lang === 'es' ? 'Seleccionar de la galería' : 'Choose from library'}</p>
                </div>
              </button>

              <button
                onClick={handleCameraClick}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Camera size={24} color="#60a5fa" />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>{lang === 'es' ? 'Cámara' : 'Camera'}</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>{lang === 'es' ? 'Tomar una foto ahora' : 'Take a photo now'}</p>
                </div>
              </button>

              <Button
                onClick={onClose}
                variant="outline"
                style={{ width: '100%', height: '48px', borderColor: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', pointerEvents: 'auto', touchAction: 'manipulation' }}
              >
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
            </div>

            <input ref={galleryInput} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} aria-label="Gallery input" />
            <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} style={{ display: 'none' }} aria-label="Camera input" />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}