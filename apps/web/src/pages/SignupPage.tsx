/**
 * Signup Page
 * User registration page with Zod validation and AuthService integration
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { isValidEmail, isValidPassword, isValidName } from '@/utils/validators';
import { FormInput } from '@/components/FormInput';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/Card';

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
      .refine(isValidPassword, 'Senha deve ter no mínimo 8 caracteres'),
    passwordConfirm: z.string().min(1, 'Confirmar senha é obrigatório'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  });

type SignupFormData = z.infer<typeof SignupSchema>;

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup: authSignup } = useAuth();
  const [formData, setFormData] = useState<Partial<SignupFormData>>({
    nome: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [globalError, setGlobalError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ nome?: string; email?: string; password?: string; passwordConfirm?: string }>({});
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
    if (name === 'nome') {
      if (!value.trim()) {
        newErrors.nome = 'Nome é obrigatório';
      } else if (!isValidName(value)) {
        newErrors.nome = 'Nome deve ter no mínimo 2 caracteres';
      } else {
        delete newErrors.nome;
      }
    } else if (name === 'email') {
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
    } else if (name === 'passwordConfirm') {
      if (!value.trim()) {
        newErrors.passwordConfirm = 'Confirme sua senha';
      } else if (value !== formData.password) {
        newErrors.passwordConfirm = 'As senhas não coincidem';
      } else {
        delete newErrors.passwordConfirm;
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
      const validatedData = SignupSchema.parse(formData);

      // Use AuthContext signup (wraps AuthService + updates TanStack Query cache)
      const result = await authSignup(
        validatedData.email,
        validatedData.password,
        validatedData.password,
        validatedData.nome
      );

      if (!result.success) {
        setGlobalError(result.error || 'Erro ao criar conta');
        return;
      }

      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      // Handle Zod validation errors
      if (err instanceof z.ZodError) {
        const firstError = err.issues[0];
        setGlobalError(firstError.message);
      } else {
        setGlobalError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Criar Conta - Alvo Diário</title>
        <meta name="description" content="Crie sua conta gratuita no Alvo Diário" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Criar conta</CardTitle>
              <CardDescription>
                Comece sua jornada rumo à aprovação
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Global error message */}
              {globalError && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">{globalError}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <FormInput
                  label="Nome Completo"
                  type="text"
                  name="nome"
                  placeholder="Seu nome"
                  value={formData.nome || ''}
                  onChange={handleChange}
                  disabled={loading}
                  error={fieldErrors.nome}
                  hint="Seu nome será exibido no dashboard"
                  required
                />

                <FormInput
                  label="Email"
                  type="email"
                  name="email"
                  placeholder="seu@email.com"
                  value={formData.email || ''}
                  onChange={handleChange}
                  disabled={loading}
                  error={fieldErrors.email}
                  hint="Use um email válido para sua conta"
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

                <FormInput
                  label="Confirmar Senha"
                  type="password"
                  name="passwordConfirm"
                  placeholder="••••••••"
                  value={formData.passwordConfirm || ''}
                  onChange={handleChange}
                  disabled={loading}
                  error={fieldErrors.passwordConfirm}
                  showPasswordToggle
                  hint="Digite a mesma senha novamente"
                  required
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-base"
                  disabled={loading || Object.keys(fieldErrors).length > 0}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
