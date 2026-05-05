import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MessageSquare, Route, Info } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-2xl mb-2">
            <Route className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Panel de Control VíasBot
          </h1>
          <p className="text-xl text-slate-600">
            Administración del bot de tráfico y clima para Telegram.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Button 
            size="lg" 
            className="h-24 text-lg bg-emerald-600 hover:bg-emerald-700 flex flex-col gap-2"
            onClick={() => setLocation("/authorized-users")}
          >
            <ShieldCheck className="h-6 w-6" />
            Usuarios Autorizados
          </Button>

          <Button 
            size="lg" 
            variant="outline"
            className="h-24 text-lg border-slate-200 hover:bg-slate-100 flex flex-col gap-2"
            disabled
          >
            <MessageSquare className="h-6 w-6 text-blue-600" />
            Historial de Consultas
            <span className="text-xs font-normal text-slate-400">(Próximamente)</span>
          </Button>
        </div>

        <div className="pt-8 border-t border-slate-200 flex items-center justify-center gap-2 text-slate-400">
          <Info className="h-4 w-4" />
          <p className="text-sm">
            Estado del sistema: <span className="text-emerald-500 font-semibold">Online</span>
          </p>
        </div>
      </div>
    </div>
  );
}
