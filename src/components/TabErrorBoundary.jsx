import React from 'react';
import TabErrorFallback from './TabErrorFallback';
import { useSafeMode } from './SafeModeProvider';
import { logger } from './logger';

/**
 * Per-tab error boundary
 * Catches errors in individual tabs without crashing the whole app
 */
class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error(`TAB_ERROR_${this.props.tabName}`, error);
    
    if (this.props.tabName === 'Home') {
      this.props.safeModeContext?.recordHomeCrash();
    }
    
    console.error(`[${this.props.tabName}]`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <TabErrorFallback
          tabName={this.props.tabName}
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Wrap with context
export default function TabErrorBoundaryWithContext({ tabName, children }) {
  const safeModeContext = useSafeMode();
  
  return (
    <TabErrorBoundary tabName={tabName} safeModeContext={safeModeContext}>
      {children}
    </TabErrorBoundary>
  );
}