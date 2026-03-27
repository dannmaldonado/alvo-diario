/**
 * Login Page
 * User authentication page
 */
// @ts-nocheck

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Header from '@/components/Header';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Email ou senha incorretos');
    }

    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Entrar - PoliceStudy</title>
        <meta name="description" content="Faça login na sua conta PoliceStudy" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="study-card">
              <div className="mb-8 text-center">
                <h1 className="mb-2 text-3xl font-bold">Bem-vindo de volta</h1>
                <p className="text-muted-foreground">
                  Entre para continuar seus estudos
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  {/* @ts-expect-error - UI label component lacks types */}
                  <Label htmlFor="email">Email</Label>
                  {/* @ts-expect-error - UI input component lacks types */}
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e: any) => handleChange(e)}
                    disabled={loading}
                    className="text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  {/* @ts-expect-error - UI label component lacks types */}
                  <Label htmlFor="password">Senha</Label>
                  {/* @ts-expect-error - UI input component lacks types */}
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e: any) => handleChange(e)}
                    disabled={loading}
                    className="text-foreground"
                  />
                </div>

                {/* @ts-expect-error - UI button component lacks types */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Não tem uma conta? </span>
                <Link
                  to="/signup"
                  className="font-medium text-primary hover:underline transition-colors duration-200"
                >
                  Criar conta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
