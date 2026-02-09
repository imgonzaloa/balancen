import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StoryViewer({ stories, currentUser, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  const currentStory = stories[currentIndex];
  const DURATION = 5000; // 5 seconds per story

  const markViewedMutation = useMutation({
    mutationFn: (storyId) => {
      const story = stories.find(s => s.id === storyId);
      if (!story.views?.includes(currentUser.email)) {
        return base44.entities.Story.update(storyId, {
          views: [...(story.views || []), currentUser.email]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-stories"] });
    },
  });

  useEffect(() => {
    if (currentStory) {
      markViewedMutation.mutate(currentStory.id);
    }
  }, [currentStory?.id]);

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / (DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-2 left-0 right-0 flex gap-1 px-2 z-10">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{
                width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%"
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden">
            {currentStory.user_avatar ? (
              <img src={currentStory.user_avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{currentStory.user_name?.charAt(0) || "?"}</span>
            )}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{currentStory.user_name}</p>
            <p className="text-white/60 text-xs">
              {new Date(currentStory.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* Story Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStory.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full h-full flex items-center justify-center"
        >
          <img
            src={currentStory.media_url}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </motion.div>
      </AnimatePresence>

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-20 left-0 right-0 px-4 z-10">
          <p className="text-white text-center text-sm bg-black/50 backdrop-blur-sm rounded-2xl px-4 py-2">
            {currentStory.caption}
          </p>
        </div>
      )}

      {/* Navigation */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors z-10"
        disabled={currentIndex === 0}
      >
        <ChevronLeft size={24} className="text-white" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors z-10"
      >
        <ChevronRight size={24} className="text-white" />
      </button>
    </div>
  );
}