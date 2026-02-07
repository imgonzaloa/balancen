import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '@/components/TranslationProvider';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

/**
 * Auth guard with 3s timeout to prevent infinite white screens
 * Shows session expired screen if auth fails
 */
export default function AuthGuard({ children }) {
  const [authState, setAuthState] = useState('checking'); // checking | authenticated | expired
  const [user, setUser] = useState(null);
  const { t } = useTranslation();
  
  useEffect(() => {
    const checkAuth = async () => {
      const timeout = setTimeout(() => {
        console.warn('[AUTH_GUARD] Timeout - assuming session expired');
        setAuthState('expired');
      }, 3000);
      
      try {
        const currentUser = await base44.auth.me();
        clearTimeout(timeout);
        
        if (currentUser) {
          setUser(currentUser);
          setAuthState('authenticated');
        } else {
          setAuthState('expired');
        }
      } catch (error) {
        clearTimeout(timeout);
        console.error('[AUTH_GUARD] Auth check failed', error);
        setAuthState('expired');
      }
    };
    
    checkAuth();
  }, []);
  
  if (authState === 'checking') {
    // Show minimal loading to prevent flash
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }
  
  if (authState === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20 text-center space-y-6">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="text-orange-400" size={32} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">
              {t('session_expired')}
            </h2>
            <p className="text-white/70 text-sm">
              {t('please_login_again')}
            </p>
          </div>

          <Button
            onClick={() => base44.auth.redirectToLogin()}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
          >
            Ingresar
          </Button>
        </div>
      </div>
    );
  }
  
  return children;
}