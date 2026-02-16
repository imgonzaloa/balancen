import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorFallback({ 
  title = "Something went wrong",
  message = "We couldn't load this content",
  errorCode = null,
  onRetry = null,
  actionLabel = "Retry",
  actionHref = null
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      
      <h3 className="text-white text-lg font-bold mb-2">
        {title}
      </h3>
      
      <p className="text-white/60 text-sm mb-1 max-w-sm">
        {message}
      </p>
      
      {errorCode && (
        <p className="text-white/40 text-xs mb-6 font-mono">
          {errorCode}
        </p>
      )}
      
      {(onRetry || actionHref) && (
        <Button
          onClick={onRetry}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-90 text-white font-semibold"
        >
          <RefreshCw size={16} className="mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function LoadingTimeout({ onRetry }) {
  return (
    <ErrorFallback
      title="Loading is taking too long"
      message="This is unusual. Please check your connection and try again."
      errorCode="TIMEOUT"
      onRetry={onRetry}
      actionLabel="Retry"
    />
  );
}