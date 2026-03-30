import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import i18n from '@/components/i18n';

export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 GLOBAL ERROR:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleNavigate = (page) => {
    window.location.href = `/${page}`;
  };

  render() {
    if (this.state.hasError) {
      const t = (key) => i18n.t(key);
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-red-500/30 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h1 className="text-white font-black text-2xl mb-2">{t("something_went_wrong")}</h1>
            <p className="text-white/70 text-sm mb-6">
              {t("app_error_desc")}
            </p>
            <Button
              onClick={this.handleReload}
              className="bg-red-500 hover:bg-red-600 text-white font-bold w-full rounded-xl mb-3"
            >
              {t("reload_app")}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => this.handleNavigate('Home')} variant="outline" className="text-white border-white/20">{t("home")}</Button>
              <Button onClick={() => this.handleNavigate('Social')} variant="outline" className="text-white border-white/20">{t("social")}</Button>
              <Button onClick={() => this.handleNavigate('Progress')} variant="outline" className="text-white border-white/20">{t("progress")}</Button>
              <Button onClick={() => this.handleNavigate('Profile')} variant="outline" className="text-white border-white/20">{t("profile")}</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}