/**
 * Home Page - Landing Page
 * Displays Alvo Diário platform features and CTAs
 */

import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Target, Calendar, Trophy, Timer, TrendingUp, Award, LucideIcon } from 'lucide-react';
import { Card } from '@/components/Card';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const HomePage: React.FC = () => {
  const features: Feature[] = [
    {
      icon: Calendar,
      title: 'Cronograma inteligente',
      description: 'Organize seus estudos com distribuição equilibrada de matérias até a data da prova'
    },
    {
      icon: Timer,
      title: 'Timer Pomodoro',
      description: 'Técnica comprovada de estudo focado com intervalos programados para máxima produtividade'
    },
    {
      icon: Trophy,
      title: 'Sistema de gamificação',
      description: 'Ganhe pontos, conquiste badges e mantenha sua sequência de estudos diários'
    },
    {
      icon: TrendingUp,
      title: 'Acompanhamento de progresso',
      description: 'Visualize seu desempenho com estatísticas detalhadas e metas personalizadas'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Alvo Diário - Disciplina Tática para sua Aprovação</title>
        <meta name="description" content="Plataforma completa de estudos para concursos policiais com cronograma inteligente, timer Pomodoro e gamificação" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1590431533633-9a64bed60fe9"
              alt="Police officer studying"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/80"></div>
          </div>

          {/* Hero Content */}
          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="mx-auto max-w-5xl glass p-8 md:p-12 rounded-3xl flex flex-col items-center">
              <h1 className="mb-6 text-4xl font-extrabold leading-tight md:text-5xl lg:text-6xl text-foreground" style={{ letterSpacing: '-0.02em' }}>
                Domine os Concursos Policiais
              </h1>
              <p className="mb-10 text-lg leading-relaxed text-muted-foreground md:text-xl max-w-3xl mx-auto">
                Prepare-se de forma estruturada e eficiente para PC, PRF e PF com cronogramas personalizados, técnicas de estudo comprovadas e acompanhamento completo do seu desempenho
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center w-full max-w-md">
                <Button size="lg" asChild className="text-base font-bold text-black dark:text-black hover:text-black dark:hover:text-black glow-primary sm:flex-1 h-14">
                  <Link to="/signup">
                    <Target className="mr-2 h-5 w-5" />
                    Começar Agora
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base font-semibold text-foreground sm:flex-1 backdrop-blur-sm bg-background/50 hover:bg-background/80 h-14 border-foreground/20">
                  <Link to="/login">
                    Entrar
                  </Link>
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="mt-16 grid grid-cols-1 gap-6 w-full sm:grid-cols-3">
                <div className="stat-card backdrop-blur-md bg-background/60 hover:-translate-y-1 transition-transform border border-border/50">
                  <Award className="h-8 w-8 text-primary mb-2 mx-auto" />
                  <div className="stat-value">3+</div>
                  <div className="stat-label">Editais Suportados</div>
                </div>
                <div className="stat-card backdrop-blur-md bg-background/60 hover:-translate-y-1 transition-transform border border-border/50">
                  <Timer className="h-8 w-8 text-primary mb-2 mx-auto" />
                  <div className="stat-value">25min</div>
                  <div className="stat-label">Sessões Pomodoro</div>
                </div>
                <div className="stat-card backdrop-blur-md bg-background/60 hover:-translate-y-1 transition-transform border border-border/50">
                  <Trophy className="h-8 w-8 text-primary mb-2 mx-auto" />
                  <div className="stat-value">100%</div>
                  <div className="stat-label">Foco Tático</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-semibold md:text-4xl">
                Recursos que fazem a diferença
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Ferramentas desenvolvidas especificamente para maximizar seu desempenho nos concursos policiais
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="group hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold">
                      {feature.title}
                    </h3>
                    <p className="leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-background relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="container relative z-10 mx-auto px-4">
            <div className="mx-auto max-w-4xl rounded-3xl glass p-12 md:p-16 text-center shadow-2xl border border-primary/20">
              <h2 className="mb-6 text-3xl font-extrabold md:text-5xl text-foreground">
                Pronto para conquistar sua vaga?
              </h2>
              <p className="mb-10 text-xl text-muted-foreground max-w-2xl mx-auto">
                Mude a forma como você estuda. Acelere sua aprovação nos maiores concursos policiais do Brasil de forma tática.
              </p>
              <Button size="lg" asChild className="text-lg font-bold text-black dark:text-black hover:text-black dark:hover:text-black px-12 py-6 h-auto glow-primary">
                <Link to="/signup">
                  Criar conta gratuita
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                © 2026 Alvo Diário. Todos os direitos reservados.
              </p>
              <div className="flex gap-6">
                <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Política de Privacidade
                </Link>
                <Link to="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                  Termos de Serviço
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
