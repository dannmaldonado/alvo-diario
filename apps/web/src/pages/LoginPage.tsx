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
import { AlertCircle } from 'lucide-react';

import { z } from 'zod';
import { isValidEmail, isValidPassword } from '@/utils/validators';
import { FormInput } from '@/components/FormInput';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';

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
    .refine(isValidPassword, 'Senha deve ter no mínimo 8 caracteres'),
});

type LoginFormData = z.infer<typeof LoginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<Partial<LoginFormData>>({
    email: '',
    password: '',
  });
  const [globalError, setGlobalError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setGlobalError('');

    // Validação em tempo real
    const newErrors = { ...fieldErrors };
    if (name === 'email') {
      if (!value.trim()) {
        newErrors.email = 'Email é obrigatório';
      } else if (!isValidEmail(value)) {
        newErrors.email = 'Email inválido';
      } else {
        delete newErrors.email;
      }
    } else if (name === 'password') {
      if (!value.trim()) {
        newErrors.password = 'Senha é obrigatória';
      } else if (!isValidPassword(value)) {
        newErrors.password = 'Senha deve ter no mínimo 8 caracteres';
      } else {
        delete newErrors.password;
      }
    }
    setFieldErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setGlobalError('');
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
        setGlobalError(firstError.message);
      } else if (err instanceof Error) {
        // Handle API errors
        setGlobalError(err.message || 'Email ou senha incorretos');
      } else {
        setGlobalError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Entrar - Alvo Diário</title>
        <meta name="description" content="Faça login na sua conta Alvo Diário" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Bem-vindo de volta</CardTitle>
              <CardDescription>
                Entre para continuar seus estudos
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Global error message */}
              {globalError && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md flex items-start gap-3 animate-slide-down">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">{globalError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <FormInput
                  label="Email"
                  type="email"
                  name="email"
                  placeholder="seu@email.com"
                  value={formData.email || ''}
                  onChange={handleChange}
                  disabled={loading}
                  error={fieldErrors.email}
                  hint="Use seu email registrado"
                  required
                />

                <FormInput
                  label="Senha"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password || ''}
                  onChange={handleChange}
                  disabled={loading}
                  error={fieldErrors.password}
                  showPasswordToggle
                  hint="Senha de no mínimo 8 caracteres"
                  required
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-base"
                  disabled={loading || Object.keys(fieldErrors).length > 0}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
