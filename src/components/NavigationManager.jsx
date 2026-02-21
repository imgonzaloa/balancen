import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const MAIN_TABS = ['Home', 'Social', 'Progress', 'Profile'];

// Per-tab navigation stack stored in module scope so it persists across re-renders
// Structure: { Home: ['/Home', '/Settings', ...], Social: [...], ... }
const tabStacks = {
  Home: [createPageUrl('Home')],
  Social: [createPageUrl('Social')],
  Progress: [createPageUrl('Progress')],
  Profile: [createPageUrl('Profile')],
};

// Which tab is currently active
let activeTab = 'Home';

function getTabForPath(pathname) {
  return MAIN_TABS.find(tab => pathname.includes(`/${tab}`)) || null;
}

/**
 * NavigationManager - Handles navigation stack and back button behavior
 * Ensures proper navigation flow for mobile apps (iOS/Android)
 */
export function NavigationManager() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const tab = getTabForPath(location.pathname);
    if (tab) {
      activeTab = tab;
    }

    // Handle Android hardware back button
    const handleBackButton = (e) => {
      const currentPath = location.pathname;
      const isMainTab = MAIN_TABS.some(page => currentPath.includes(`/${page}`) && 
        !currentPath.replace(`/${page}`, '').includes('/'));

      if (isMainTab) {
        e.preventDefault();
        return false;
      }
      return true;
    };

    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [location, navigate]);

  return null;
}

/**
 * useTabNavigation - Smart tab navigation with stack preservation
 * Call navigateToTab(tabName) to switch tabs, remembering their last position.
 * Call resetTab(tabName) to go back to the root of a tab.
 */
export function useTabNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateToTab = useCallback((tabName) => {
    const currentTab = getTabForPath(location.pathname);
    const isAlreadyActive = currentTab === tabName;

    if (isAlreadyActive) {
      // Reset to root of this tab
      const root = createPageUrl(tabName);
      tabStacks[tabName] = [root];
      navigate(root, { replace: true, state: { tabRoot: true } });
    } else {
      // Restore last position in that tab
      const stack = tabStacks[tabName];
      const destination = stack?.[stack.length - 1] || createPageUrl(tabName);
      activeTab = tabName;
      navigate(destination, { replace: false, state: { tabSwitch: true } });
    }
  }, [navigate, location.pathname]);

  // Track pushes within a tab to update that tab's stack
  const pushInTab = useCallback((pageName, options = {}) => {
    const url = createPageUrl(pageName);
    const tab = activeTab;
    if (tab && tabStacks[tab]) {
      tabStacks[tab] = [...tabStacks[tab], url];
    }
    navigate(url, { replace: options.replace || false, state: options.state });
  }, [navigate]);

  const goBack = useCallback(() => {
    const tab = activeTab;
    if (tab && tabStacks[tab] && tabStacks[tab].length > 1) {
      tabStacks[tab] = tabStacks[tab].slice(0, -1);
      navigate(-1);
    } else {
      navigate(createPageUrl('Home'), { replace: true });
    }
  }, [navigate]);

  return { navigateToTab, pushInTab, goBack };
}

/**
 * Navigation helper - intelligently navigates with proper stack management
 * (kept for backward compatibility)
 */
export function useSmartNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateTo = (pageName, options = {}) => {
    const { replace = false, state = {} } = options;
    const url = createPageUrl(pageName);
    navigate(url, { replace, state });
  };

  const goBack = () => {
    const mainPages = ['/Home', '/Social', '/Progress', '/Profile'];
    if (mainPages.some(page => location.pathname.includes(page)) || window.history.length <= 1) {
      navigateTo('Home', { replace: true });
    } else {
      navigate(-1);
    }
  };

  return { navigateTo, goBack, currentPath: location.pathname };
}