/**
 * Signup Page
 * User registration page with Zod validation and AuthService integration
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
import { isValidEmail, isValidPassword, isValidName } from '@/utils/validators';

/**
 * Zod schema for signup form validation
 */
const SignupSchema = z
  .object({
    nome: z
      .string()
      .min(1, 'Nome é obrigatório')
      .refine(isValidName, 'Nome deve ter no mínimo 2 caracteres'),
    email: z
      .string()
      .min(1, 'Email é obrigatório')
      .refine(isValidEmail, 'Email inválido'),
    password: z
      .string()
      .min(1, 'Senha é obrigatória')
      .refine(isValidPassword, 'Senha deve ter no mínimo 6 caracteres'),
    passwordConfirm: z.string().min(1, 'Confirmar senha é obrigatório'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  });

type SignupFormData = z.infer<typeof SignupSchema>;

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState<Partial<SignupFormData>>({
    nome: '',
    email: '',
    password: '',
    passwordConfirm: '',
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
      const validatedData = SignupSchema.parse(formData);

      // Use AuthService for signup
      await AuthService.signup({
        email: validatedData.email,
        password: validatedData.password,
        nome: validatedData.nome,
      });

      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      // Handle validation errors
      if (err instanceof z.ZodError) {
        const firstError = err.issues[0];
        setError(firstError.message);
      } else if (err instanceof Error) {
        // Handle API errors (duplicate email, etc)
        setError(err.message || 'Erro ao criar conta');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Criar Conta - PoliceStudy</title>
        <meta name="description" content="Crie sua conta gratuita no PoliceStudy" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="study-card">
              <div className="mb-8 text-center">
                <h1 className="mb-2 text-3xl font-bold">Criar conta</h1>
                <p className="text-muted-foreground">
                  Comece sua jornada rumo à aprovação
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
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    name="nome"
                    type="text"
                    placeholder="Seu nome"
                    value={formData.nome || ''}
                    onChange={handleChange}
                    disabled={loading}
                    className="text-foreground"
                    required
                  />
                </div>

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
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password || ''}
                    onChange={handleChange}
                    disabled={loading}
                    className="text-foreground"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm">Confirmar senha</Label>
                  <Input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={formData.passwordConfirm || ''}
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
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Já tem uma conta? </span>
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline transition-colors duration-200"
                >
                  Entrar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
