/**
 * PullToRefresh - standalone floating indicator only.
 * Does NOT wrap children in a scroll container (that was the scroll bug).
 * Attaches touch listeners to the nearest scrollable ancestor.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function PullToRefresh({ children, disabled = false }) {
  const queryClient = useQueryClient();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const wrapperRef = useRef(null);

  const getScrollParent = useCallback((el) => {
    while (el && el !== document.documentElement) {
      const style = window.getComputedStyle(el);
      const overflow = style.overflowY;
      if (overflow === 'auto' || overflow === 'scroll') return el;
      el = el.parentElement;
    }
    return document.documentElement;
  }, []);

  useEffect(() => {
    if (disabled) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const scrollParent = getScrollParent(wrapper.parentElement || wrapper);

    const handleTouchStart = (e) => {
      const scrollTop = scrollParent === document.documentElement
        ? document.documentElement.scrollTop
        : scrollParent.scrollTop;
      if (scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isPullingRef.current) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0) {
        setPullDistance(Math.min(dy, 100));
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;
      if (pullDistance > 60 && !isRefreshing) {
        console.log('[PULL_TO_REFRESH] Triggered');
        setIsRefreshing(true);
        await queryClient.refetchQueries();
        setIsRefreshing(false);
      }
      setPullDistance(0);
    };

    scrollParent.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollParent.addEventListener('touchmove', handleTouchMove, { passive: true });
    scrollParent.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      scrollParent.removeEventListener('touchstart', handleTouchStart);
      scrollParent.removeEventListener('touchmove', handleTouchMove);
      scrollParent.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, pullDistance, isRefreshing, queryClient, getScrollParent]);

  const pullProgress = Math.min(pullDistance / 60, 1);

  return (
    // Plain div, NO overflow-y: auto - does not create a scroll container
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Floating pull indicator */}
      {(pullDistance > 10 || isRefreshing) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: pullProgress > 0.3 || isRefreshing ? 1 : 0, scale: Math.max(0.5, pullProgress) }}
          className="absolute top-2 left-0 right-0 flex justify-center z-10 pointer-events-none"
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ rotate: isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0 } }}
            className="w-10 h-10 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <RefreshCw size={18} className="text-white" />
          </motion.div>
        </motion.div>
      )}
      {children}
    </div>
  );
}