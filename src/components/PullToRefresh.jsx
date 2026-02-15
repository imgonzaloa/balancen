/**
 * Pull-to-Refresh component for mobile
 * Refresh all queries on pull down
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function PullToRefresh({ children, disabled = false }) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const scrollableRef = useRef(null);

  useEffect(() => {
    const element = scrollableRef.current;
    if (!element) return;

    let touchStartY = 0;

    const handleTouchStart = (e) => {
      if (element.scrollTop === 0) {
        touchStartY = e.touches[0].clientY;
        startYRef.current = touchStartY;
      }
    };

    const handleTouchMove = (e) => {
      if (element.scrollTop !== 0) return;
      
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startYRef.current);
      
      if (distance > 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, 120));
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > 60 && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(0);
        
        try {
          // Refresh all queries
          await queryClient.refetchQueries();
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setPullDistance(0);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, false);
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, queryClient]);

  const pullProgress = Math.min(pullDistance / 60, 1);

  return (
    <div ref={scrollableRef} className="relative overflow-y-auto">
      {/* Pull indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: pullProgress > 0.3 ? 1 : 0 }}
        className="sticky top-0 z-10 flex justify-center py-4"
      >
        <motion.div
          animate={{
            scale: isRefreshing ? 1 : Math.max(0.5, pullProgress),
            rotate: isRefreshing ? 360 : 0,
          }}
          transition={{
            rotate: isRefreshing ? { duration: 1, repeat: Infinity } : { duration: 0 },
          }}
          className="w-10 h-10 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center"
        >
          <RefreshCw size={20} className="text-white" />
        </motion.div>
      </motion.div>

      {/* Content with pull transform */}
      <motion.div
        style={{
          y: Math.min(pullDistance, 60),
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}