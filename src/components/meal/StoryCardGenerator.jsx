import React, { useRef, useState } from 'react';
import { Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BALANCEN_LOGO =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%2314b8a6%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2265%22 font-size=%2248%22 font-weight=%22bold%22 text-anchor=%22middle%22 fill=%22white%22%3EB%3C/text%3E%3C/svg%3E';

export default function StoryCardGenerator({ mealName, macros, streak, onShared }) {
  const canvasRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  const generateCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas size (Instagram Story is 1080x1920)
    canvas.width = 1080;
    canvas.height = 1920;

    // Dark background with gradient
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(0.5, '#134e4a');
    gradient.addColorStop(1, '#065f46');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Teal accent border
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 1040, 1880);

    // Balancen logo (top left)
    const logo = new Image();
    logo.onload = () => {
      ctx.drawImage(logo, 60, 80, 80, 80);
      continue_draw();
    };
    logo.onerror = () => continue_draw();
    logo.src = BALANCEN_LOGO;

    const continue_draw = () => {
      // Title "Meal Logged"
      ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText('Meal Logged', 60, 280);

      // Meal name
      ctx.font = '48px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#14b8a6';
      ctx.fillText(mealName || 'Your meal', 60, 380);

      // Divider line
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(60, 420);
      ctx.lineTo(1020, 420);
      ctx.stroke();

      // Macros section header
      ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Nutrition', 60, 520);

      // Calories (large)
      ctx.font = 'bold 80px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#14b8a6';
      ctx.textAlign = 'center';
      ctx.fillText(macros.calories.toString(), 270, 750);

      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#a0f0da';
      ctx.fillText('KCAL', 270, 810);

      // Macro grid (protein, carbs, fats)
      const macroItems = [
        { label: 'Protein', value: macros.protein, color: '#60a5fa', x: 450 },
        { label: 'Carbs', value: macros.carbs, color: '#fbbf24', x: 750 },
      ];

      macroItems.forEach(({ label, value, color, x }) => {
        ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText(value.toString(), x, 750);

        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#d1d5db';
        ctx.fillText(label.toUpperCase(), x, 810);
      });

      // Fats on new row
      ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#f472b6';
      ctx.textAlign = 'center';
      ctx.fillText(macros.fats.toString(), 600, 950);

      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#d1d5db';
      ctx.fillText('FATS', 600, 1010);

      // Divider before streak
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 1080);
      ctx.lineTo(1020, 1080);
      ctx.stroke();

      // Streak (bottom)
      ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText('🔥 Current Streak', 540, 1200);

      ctx.font = 'bold 96px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#14b8a6';
      ctx.fillText(streak.toString(), 540, 1370);

      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#a0f0da';
      ctx.fillText('DAYS', 540, 1430);

      // Balancen branding (bottom)
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#14b8a6';
      ctx.textAlign = 'center';
      ctx.fillText('balancen.app', 540, 1750);

      ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#a0f0da';
      ctx.fillText('Stay consistent, stay healthy', 540, 1820);
    };
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      // Generate canvas
      await generateCard();
      
      const canvas = canvasRef.current;
      if (!canvas) {
        toast.error('Failed to generate card');
        return;
      }

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to generate image');
          setSharing(false);
          return;
        }

        // Check if navigator.share is available
        if (!navigator.share) {
          toast.error('Share not supported on this device');
          setSharing(false);
          return;
        }

        try {
          const file = new File([blob], 'balancen-meal.jpg', { type: 'image/jpeg' });
          await navigator.share({
            files: [file],
            title: 'My Balancen Meal',
            text: `Just logged ${mealName || 'a meal'} on Balancen! 🍽️`,
          });
          toast.success('Shared to Stories!');
          if (onShared) onShared();
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Share error:', err);
            toast.error('Failed to share');
          }
        } finally {
          setSharing(false);
        }
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error('Card generation error:', err);
      toast.error('Failed to generate card');
      setSharing(false);
    }
  };

  return (
    <>
      {/* Hidden canvas for generating image */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Share button */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 transition-all"
      >
        {sharing ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Share2 size={18} />
        )}
        {sharing ? 'Generating...' : 'Compartir en Stories'}
      </button>
    </>
  );
}