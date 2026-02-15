import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * NavigationManager - Handles navigation stack and back button behavior
 * Ensures proper navigation flow for mobile apps (iOS/Android)
 */
export function NavigationManager() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle Android hardware back button
    const handleBackButton = (e) => {
      const currentPath = location.pathname;
      const mainPages = ['/Home', '/Social', '/Progress', '/Profile'];
      
      // If on a main tab, don't allow back - prevent app exit
      if (mainPages.some(page => currentPath.includes(page))) {
        e.preventDefault();
        return false;
      }
      
      // Otherwise, allow normal back navigation
      return true;
    };

    // Listen for popstate (browser/app back button)
    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [location, navigate]);

  return null;
}

/**
 * Navigation helper - intelligently navigates with proper stack management
 */
export function useSmartNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateTo = (pageName, options = {}) => {
    const { replace = false, state = {} } = options;
    const url = createPageUrl(pageName);
    
    // Track navigation for analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: url,
        page_title: pageName
      });
    }

    navigate(url, { replace, state });
  };

  const goBack = () => {
    const mainPages = ['/Home', '/Social', '/Progress', '/Profile'];
    
    // If on a main tab or can't go back, go to Home
    if (mainPages.some(page => location.pathname.includes(page)) || window.history.length <= 1) {
      navigateTo('Home', { replace: true });
    } else {
      navigate(-1);
    }
  };

  return { navigateTo, goBack, currentPath: location.pathname };
}