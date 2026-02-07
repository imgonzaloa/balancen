/**
 * useMediaQuery Hook
 * Check if a media query matches
 */

import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Listen for changes
    const listener = (e) => setMatches(e.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}