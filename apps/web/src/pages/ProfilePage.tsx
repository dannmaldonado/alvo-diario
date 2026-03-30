
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Flame, Target, Save, LogOut } from 'lucide-react';
import { toast } from 'sonner';


const ProfilePage: React.FC = () => {
  const { currentUser, updateUser, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: currentUser?.nome || '',
    meta_diaria_horas: currentUser?.meta_diaria_horas || 4
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updates = {
        nome: formData.nome,
        meta_diaria_horas: parseFloat(formData.meta_diaria_horas as unknown as string)
      };

      const result = await updateUser(updates);
      
      if (result.success) {
        toast.success('Perfil atualizado com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string | undefined | null): string => {
    if (!name) return 'PS';
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <Helmet>
        <title>Meu Perfil - Alvo Diário</title>
        <meta name="description" content="Gerencie seu perfil e metas de estudo" />
      </Helmet>

      <div className="min-h-screen bg-background">


        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold md:text-4xl">Meu Perfil</h1>
              <p className="text-lg text-muted-foreground">
                Gerencie suas informações e metas
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Left Column - Stats & Avatar */}
              <div className="space-y-6 md:col-span-1">
                <div className="study-card text-center">
                  <Avatar className="mx-auto mb-4 h-24 w-24">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                      {getInitials(currentUser?.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">{currentUser?.nome}</h2>
                  <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                  
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary">
                    <Target className="h-4 w-4" />
                    {currentUser?.nivel_atual || 'Iniciante'}
                  </div>
                </div>

                <div className="study-card-muted space-y-4">
                  <h3 className="font-semibold">Estatísticas</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Trophy className="h-4 w-4" />
                      <span>Pontos Totais</span>
                    </div>
                    <span className="font-medium">{currentUser?.pontos_totais || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Flame className="h-4 w-4" />
                      <span>Sequência Atual</span>
                    </div>
                    <span className="font-medium">{currentUser?.streak_atual || 0} dias</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Settings */}
              <div className="space-y-6 md:col-span-2">
                <div className="study-card">
                  <h2 className="mb-6 text-xl font-semibold">Informações Pessoais</h2>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={(e: any) => handleChange(e)}
                        className="text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email (não editável)</Label>
                      <Input
                        id="email"
                        value={currentUser?.email || ''}
                        disabled
                        className="bg-muted text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div className="study-card">
                  <h2 className="mb-6 text-xl font-semibold">Metas de Estudo</h2>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="meta_diaria_horas">Meta Diária (horas)</Label>
                      <Input
                        id="meta_diaria_horas"
                        name="meta_diaria_horas"
                        type="number"
                        min="1"
                        max="24"
                        step="0.5"
                        value={formData.meta_diaria_horas}
                        onChange={(e: any) => handleChange(e)}
                        className="text-foreground"
                      />
                      <p className="text-sm text-muted-foreground">
                        Defina quantas horas você pretende estudar por dia.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair da conta
                  </Button>

                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
