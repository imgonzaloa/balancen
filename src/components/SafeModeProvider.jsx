import React, { createContext, useContext, useEffect, useState } from 'react';
import { logger } from './logger';

const SafeModeContext = createContext(null);

export function SafeModeProvider({ children }) {
  const [safeMode, setSafeMode] = useState(false);
  
  useEffect(() => {
    // Check safe mode on mount
    const isSafeMode = localStorage.getItem('SAFE_MODE') === '1';
    setSafeMode(isSafeMode);
    
    if (isSafeMode) {
      logger.log('SAFE_MODE_ENABLED');
    }
  }, []);
  
  const enableSafeMode = () => {
    localStorage.setItem('SAFE_MODE', '1');
    setSafeMode(true);
    logger.log('SAFE_MODE_ACTIVATED');
    window.location.reload();
  };
  
  const disableSafeMode = () => {
    localStorage.removeItem('SAFE_MODE');
    setSafeMode(false);
    logger.log('SAFE_MODE_DISABLED');
    window.location.reload();
  };
  
  const recordHomeCrash = () => {
    const count = parseInt(localStorage.getItem('HOME_CRASH_COUNT') || '0') + 1;
    localStorage.setItem('HOME_CRASH_COUNT', count.toString());
    logger.log('HOME_CRASH', { count });
    
    if (count >= 2) {
      logger.log('AUTO_ENABLING_SAFE_MODE', { afterCrashes: count });
      enableSafeMode();
    }
  };
  
  return (
    <SafeModeContext.Provider value={{
      safeMode,
      enableSafeMode,
      disableSafeMode,
      recordHomeCrash,
    }}>
      {children}
    </SafeModeContext.Provider>
  );
}

export function useSafeMode() {
  return useContext(SafeModeContext);
}