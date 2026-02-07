import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * App-wide error boundary with retry functionality
 * Prevents white screens and provides recovery
 */
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[APP_ERROR_BOUNDARY]", {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    });

    // Track error count to prevent infinite loops
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }));
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // If error count > 3, show simpler recovery screen
      const isCritical = this.state.errorCount > 3;

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20 text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="text-red-400" size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                {isCritical ? "Error crítico" : "Algo salió mal"}
              </h2>
              <p className="text-white/70 text-sm">
                {isCritical 
                  ? "La app necesita reiniciarse. Contacta soporte si el problema persiste."
                  : "Estamos trabajando para solucionarlo. Intentá recargar la pantalla."}
              </p>
            </div>

            <div className="space-y-3">
              {!isCritical && (
                <Button
                  onClick={this.handleRetry}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                >
                  Recargar
                </Button>
              )}
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                Volver al inicio
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left text-xs text-red-300 bg-red-900/20 p-3 rounded-lg">
                <summary className="cursor-pointer font-semibold mb-2">Error details</summary>
                <pre className="overflow-auto text-[10px] whitespace-pre-wrap">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;