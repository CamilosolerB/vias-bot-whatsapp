import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, UserPlus, ShieldCheck, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AuthorizedUsers() {
  const [newUserId, setNewUserId] = useState("");
  const [, setLocation] = useLocation();
  const utils = trpc.useContext();

  const { data: users, isLoading } = trpc.authorizedUsers.list.useQuery();
  
  const addMutation = trpc.authorizedUsers.add.useMutation({
    onSuccess: () => {
      toast.success("Usuario autorizado correctamente");
      setNewUserId("");
      utils.authorizedUsers.list.invalidate();
    },
    onError: (error) => {
      toast.error("Error al autorizar usuario: " + error.message);
    }
  });

  const removeMutation = trpc.authorizedUsers.remove.useMutation({
    onSuccess: () => {
      toast.success("Usuario eliminado de la lista");
      utils.authorizedUsers.list.invalidate();
    },
    onError: (error) => {
      toast.error("Error al eliminar usuario: " + error.message);
    }
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim()) return;
    addMutation.mutate({ telegramId: newUserId.trim() });
  };

  const handleRemoveUser = (id: string) => {
    if (confirm(`¿Estás seguro de que quieres revocar el acceso al ID ${id}?`)) {
      removeMutation.mutate({ telegramId: id });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestión de Acceso</h1>
            <p className="text-slate-500">Controla quién puede interactuar con el bot de Telegram</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 border-emerald-100 bg-emerald-50/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-600" />
                Autorizar ID
              </CardTitle>
              <CardDescription>
                Ingresa el ID numérico de Telegram del usuario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Ej: 123456789"
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    className="border-slate-200"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={addMutation.isLoading}
                >
                  {addMutation.isLoading ? "Agregando..." : "Autorizar Usuario"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                Usuarios Autorizados
              </CardTitle>
              <CardDescription>
                Lista de IDs que actualmente tienen permiso de uso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                </div>
              ) : users?.data && users.data.length > 0 ? (
                <div className="rounded-md border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>ID de Telegram</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.data.map((id: string) => (
                        <TableRow key={id} className="hover:bg-slate-50/50">
                          <TableCell className="font-mono font-medium">{id}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleRemoveUser(id)}
                              disabled={removeMutation.isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <p className="text-slate-400">No hay usuarios autorizados todavía.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
