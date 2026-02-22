import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PhotoPickerModal({ isOpen, onClose, onSelectFile, anchorRef }) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const galleryInput = useRef(null);
  const [pos, setPos] = useState({ top: 80, left: 16 });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (anchorRef?.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        const popoverWidth = 220;
        const spaceRight = window.innerWidth - rect.right;
        const left = spaceRight >= popoverWidth + 8
          ? rect.right + 8
          : rect.left - popoverWidth - 8;
        setPos({
          top: rect.top,
          left: Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8)),
        });
      }
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, anchorRef]);

  // Gallery only — NO capture attribute
  const handleGallerySelect = (e) => {
    const file = e.target.files?.[0];
    if (file) { onSelectFile(file); onClose(); }
    e.target.value = '';
  };

  const handleChooseFromGallery = () => {
    console.log('[ProfilePhoto] gallery');
    galleryInput.current.value = '';
    galleryInput.current.click();
  };

  // Camera — navigate to CameraScreen in profilePhoto mode, never touch a file input
  const handleTakePhoto = () => {
    console.log('[ProfilePhoto] camera');
    localStorage.setItem('CAMERA_MODE', 'profilePhoto');
    localStorage.setItem('CAMERA_RETURN_ROUTE', createPageUrl('Profile'));
    onClose();
    navigate(createPageUrl('CameraScreen') + '?mode=profilePhoto&return=' + encodeURIComponent(createPageUrl('Profile')));
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 2147483646,
          touchAction: 'none',
        }}
      />

      {/* Popover */}
      <div
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          zIndex: 2147483647,
          minWidth: '220px',
          background: '#0b1220',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '14px',
          padding: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 8px' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {lang === 'es' ? 'Foto de perfil' : 'Profile photo'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'rgba(255,255,255,0.5)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Gallery */}
        <button
          onClick={handleChooseFromGallery}
          style={{
            width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', gap: '12px',
            background: 'none', border: 'none', cursor: 'pointer', padding: '10px 12px',
            borderRadius: '10px', color: '#fff', touchAction: 'manipulation',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ImageIcon size={18} color="#34d399" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 500 }}>
            {lang === 'es' ? 'Elegir de galería' : 'Choose from gallery'}
          </span>
        </button>

        {/* Camera */}
        <button
          onClick={handleTakePhoto}
          style={{
            width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', gap: '12px',
            background: 'none', border: 'none', cursor: 'pointer', padding: '10px 12px',
            borderRadius: '10px', color: '#fff', touchAction: 'manipulation',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Camera size={18} color="#60a5fa" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 500 }}>
            {lang === 'es' ? 'Tomar foto' : 'Take photo'}
          </span>
        </button>

        {/* Gallery input — NO capture attribute */}
        <input ref={galleryInput} type="file" accept="image/*" onChange={handleGallerySelect} style={{ display: 'none' }} />
        {/* Camera input — capture="environment" forces camera */}
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={handleCameraSelect} style={{ display: 'none' }} />
      </div>
    </>,
    document.body
  );
}