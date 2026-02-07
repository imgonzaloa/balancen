/**
 * Premium Profile Setup Screen
 * After onboarding: photo upload + username confirmation
 * Instagram-style setup experience
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '@/components/TranslationProvider';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import PhotoPicker from '@/components/profile/PhotoPicker';
import { processImage } from '@/components/ImageProcessor';

export default function ProfileSetup() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const profiles = await base44.entities.UserProfile.filter({ created_by: u?.email });
      if (profiles?.[0]) {
        setProfile(profiles[0]);
        setDisplayName(profiles[0].display_name || '');
      }
    });
  }, []);

  const handlePhotoSelected = async (file) => {
    try {
      const processed = await processImage(file);
      const tempUrl = URL.createObjectURL(processed);
      setProfilePhoto(tempUrl);

      // Upload immediately
      const formData = new FormData();
      formData.append('file', processed);

      try {
        const response = await base44.integrations.Core.UploadFile({ file: processed });
        setProfilePhoto(response.file_url);
      } catch (err) {
        console.error('Upload error:', err);
      }
    } catch (err) {
      toast.error(lang === 'es' ? 'Error procesando imagen' : 'Error processing image');
    }
  };

  const handleComplete = async () => {
    if (!displayName.trim()) {
      toast.error(lang === 'es' ? 'Ingresa tu nombre' : 'Enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        display_name: displayName,
      };
      if (profilePhoto) {
        updateData.profile_photo = profilePhoto;
        updateData.avatar_url = profilePhoto;
      }

      await base44.entities.UserProfile.update(profile.id, updateData);
      navigate(createPageUrl('Home'));
    } catch (error) {
      toast.error(lang === 'es' ? 'Error guardando perfil' : 'Error saving profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">
            {lang === 'es' ? 'Tu Perfil' : 'Your Profile'}
          </h1>
          <p className="text-white/60">
            {lang === 'es' ? 'Configura tu perfil' : 'Set up your profile'}
          </p>
        </div>

        {/* Photo Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 mb-6 text-center"
        >
          <button
            onClick={() => setShowPhotoPicker(true)}
            className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 hover:shadow-lg transition-shadow"
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover rounded-full" />
            ) : (
              <Camera size={48} className="text-white" />
            )}
          </button>
          <p className="text-white/60 text-sm">
            {lang === 'es' ? 'Agrega una foto' : 'Add a photo'}
          </p>
        </motion.div>

        {/* Name Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6"
        >
          <label className="text-white font-semibold mb-3 block text-sm">
            {lang === 'es' ? 'Tu nombre' : 'Your name'}
          </label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={lang === 'es' ? 'Tu nombre' : 'Your name'}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 text-lg"
          />
        </motion.div>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            className="w-full h-14 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-lg rounded-2xl disabled:opacity-50"
          >
            {isLoading ? (
              <span>Loading...</span>
            ) : (
              <>
                {lang === 'es' ? 'Ir a Home' : 'Go to Home'} <ChevronRight className="ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>

      <PhotoPicker
        isOpen={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onSelect={handlePhotoSelected}
      />
    </div>
  );
}