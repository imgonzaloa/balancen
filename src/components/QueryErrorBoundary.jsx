import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export default function QueryErrorBoundary({ error, reset, queryKey }) {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    if (queryKey) {
      queryClient.invalidateQueries({ queryKey });
    }
    reset?.();
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center space-y-4">
      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="text-red-400" size={24} />
      </div>
      
      <div className="space-y-1">
        <h3 className="text-white font-semibold">Error al cargar datos</h3>
        <p className="text-white/60 text-sm">
          No pudimos cargar esta información. Verificá tu conexión.
        </p>
      </div>

      <Button
        onClick={handleRetry}
        variant="outline"
        className="border-white/20 text-white hover:bg-white/10"
      >
        <RefreshCw size={16} className="mr-2" />
        Reintentar
      </Button>
    </div>
  );
}