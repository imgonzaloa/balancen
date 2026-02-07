import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, X } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';

/**
 * iOS-style action sheet for photo selection
 * Allows choosing from gallery or taking a new photo
 */
export default function PhotoPicker({ isOpen, onClose, onSelect }) {
  const { t } = useTranslation();
  
  const handleGallery = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,image/heic,image/heif';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        onSelect(file);
        onClose();
      }
    };
    input.click();
  };
  
  const handleCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        onSelect(file);
        onClose();
      }
    };
    input.click();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />
          
          {/* Action Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[201] max-w-lg mx-auto p-4"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
              {/* Options */}
              <button
                onClick={handleGallery}
                className="w-full flex items-center gap-4 p-5 hover:bg-black/5 active:bg-black/10 transition-colors border-b border-black/10"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Image size={24} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">{t('choose_from_gallery')}</p>
                  <p className="text-sm text-gray-600">
                    {typeof t === 'function' ? (t.lang === 'es' ? 'Elegir una foto existente' : 'Choose an existing photo') : 'Select from gallery'}
                  </p>
                </div>
              </button>
              
              <button
                onClick={handleCamera}
                className="w-full flex items-center gap-4 p-5 hover:bg-black/5 active:bg-black/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Camera size={24} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">{t('take_photo')}</p>
                  <p className="text-sm text-gray-600">
                    {typeof t === 'function' ? (t.lang === 'es' ? 'Usar la cámara' : 'Use the camera') : 'Take a new photo'}
                  </p>
                </div>
              </button>
            </div>
            
            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="w-full bg-white/95 backdrop-blur-xl rounded-3xl p-5 mt-3 font-semibold text-gray-900 hover:bg-white active:bg-gray-100 transition-colors shadow-xl"
            >
              {t('cancel')}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}