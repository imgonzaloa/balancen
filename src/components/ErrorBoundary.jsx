import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import i18n from "@/components/i18n";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to analytics
    console.error("Error caught by boundary:", error, errorInfo);
    
    // Track error event
    if (window.base44?.analytics) {
      window.base44.analytics.track({
        eventName: "error_boundary_triggered",
        properties: {
          error_message: error?.message || "Unknown error",
          component_stack: errorInfo?.componentStack?.slice(0, 200) || "",
          screen: this.props.screen || "unknown"
        }
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const t = (key) => i18n.t(key);
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20 text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="text-red-400" size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">
                {t("error_boundary_title")}
              </h2>
              <p className="text-white/70 text-sm">
                {t("error_boundary_desc")}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
              >
                {t("reload")}
              </Button>
              
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/";
                }}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                {t("go_home")}
              </Button>
            </div>

            {import.meta.env.DEV && (
              <details className="text-left text-xs text-red-300 bg-red-900/20 p-3 rounded-lg">
                <summary className="cursor-pointer font-semibold mb-2">Error details</summary>
                <pre className="overflow-auto text-[10px]">
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

export default ErrorBoundary;