/**
 * Login Page
 * User authentication page with Zod validation and AuthService integration
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import { z } from 'zod';
import { isValidEmail, isValidPassword } from '@/utils/validators';

/**
 * Zod schema for login form validation
 */
const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .refine(isValidEmail, 'Email inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .refine(isValidPassword, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof LoginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<Partial<LoginFormData>>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form data with Zod
      const validatedData = LoginSchema.parse(formData);

      // Use AuthService for login
      await AuthService.login({
        email: validatedData.email,
        password: validatedData.password,
      });

      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      // Handle validation errors
      if (err instanceof z.ZodError) {
        const firstError = err.issues[0];
        setError(firstError.message);
      } else if (err instanceof Error) {
        // Handle API errors
        setError(err.message || 'Email ou senha incorretos');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email || ''}
                    onChange={handleChange}
                    disabled={loading}
                    className="text-foreground"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password || ''}
                    onChange={handleChange}
                    disabled={loading}
                    className="text-foreground"
                    required
                  />
                </div>

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
