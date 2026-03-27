/**
 * Brand Color Showcase Component
 *
 * Demonstra o uso da nova paleta ALVO DIÁRIO
 * Remove após validação visual
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { designTokens } from '@/lib/design-tokens';

export const BrandShowcase: React.FC = () => {
  return (
    <div className="space-y-8 p-8 bg-background">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">ALVO DIÁRIO - Brand Showcase</h1>
        <p className="text-muted-foreground">Nova identidade visual oficial</p>
      </div>

      {/* Logo Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border rounded-lg p-6 bg-card">
          <h3 className="text-lg font-semibold mb-4">Logo Vertical</h3>
          <img
            src="/assets/logos/logo-vertical.png"
            alt="ALVO DIÁRIO Vertical"
            className="w-full h-auto max-w-sm mx-auto"
          />
        </div>
        <div className="border rounded-lg p-6 bg-card">
          <h3 className="text-lg font-semibold mb-4">Logo Horizontal</h3>
          <img
            src="/assets/logos/logo-horizontal.png"
            alt="ALVO DIÁRIO Horizontal"
            className="w-full h-auto max-w-sm mx-auto"
          />
        </div>
      </div>

      {/* Primary Colors */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Cores Primárias</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Azul 1 */}
          <div className="border rounded-lg overflow-hidden">
            <div
              className="h-24 w-full"
              style={{ backgroundColor: designTokens.colors.primary[1] }}
            />
            <div className="p-3 bg-card">
              <p className="font-semibold text-sm">Azul 1</p>
              <p className="text-xs text-muted-foreground">#1675F2</p>
              <p className="text-xs text-muted-foreground">22, 117, 242</p>
            </div>
          </div>

          {/* Azul 2 */}
          <div className="border rounded-lg overflow-hidden">
            <div
              className="h-24 w-full"
              style={{ backgroundColor: designTokens.colors.primary[2] }}
            />
            <div className="p-3 bg-card">
              <p className="font-semibold text-sm">Azul 2</p>
              <p className="text-xs text-muted-foreground">#3084F2</p>
              <p className="text-xs text-muted-foreground">48, 132, 242</p>
            </div>
          </div>

          {/* Cinza */}
          <div className="border rounded-lg overflow-hidden">
            <div
              className="h-24 w-full"
              style={{ backgroundColor: designTokens.colors.secondary.gray }}
            />
            <div className="p-3 bg-card">
              <p className="font-semibold text-sm">Cinza</p>
              <p className="text-xs text-muted-foreground">#566873</p>
              <p className="text-xs text-muted-foreground">86, 104, 115</p>
            </div>
          </div>

          {/* Amarelo */}
          <div className="border rounded-lg overflow-hidden">
            <div
              className="h-24 w-full"
              style={{ backgroundColor: designTokens.colors.secondary.yellow }}
            />
            <div className="p-3 bg-card">
              <p className="font-semibold text-sm">Amarelo</p>
              <p className="text-xs text-muted-foreground">#F2E96D</p>
              <p className="text-xs text-muted-foreground">242, 233, 109</p>
            </div>
          </div>

          {/* Neutral */}
          <div className="border border-2 rounded-lg overflow-hidden">
            <div
              className="h-24 w-full"
              style={{ backgroundColor: designTokens.colors.secondary.neutral }}
            />
            <div className="p-3 bg-card">
              <p className="font-semibold text-sm">Neutral</p>
              <p className="text-xs text-muted-foreground">#F1F2F0</p>
              <p className="text-xs text-muted-foreground">241, 242, 240</p>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Button Variants</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary (Azul 1)</Button>
          <Button variant="secondary">Secondary (Amarelo)</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>

      {/* Cards with Colors */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Cards com Cores da Brand</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary Blue Card */}
          <div className="rounded-lg p-6 bg-primary text-primary-foreground">
            <h3 className="font-bold text-lg mb-2">Azul Primária</h3>
            <p className="text-sm opacity-90">Use para ações principais e estados ativos</p>
          </div>

          {/* Yellow Accent Card */}
          <div className="rounded-lg p-6 bg-accent text-accent-foreground">
            <h3 className="font-bold text-lg mb-2">Amarelo Destaque</h3>
            <p className="text-sm opacity-90">Use para avisos e chamadas de atenção</p>
          </div>

          {/* Secondary Blue Card */}
          <div className="rounded-lg p-6 bg-secondary text-secondary-foreground">
            <h3 className="font-bold text-lg mb-2">Azul Secundária</h3>
            <p className="text-sm opacity-90">Use para informações e elementos suportados</p>
          </div>
        </div>
      </div>

      {/* Text Colors */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Variações de Texto</h2>
        <div className="space-y-2">
          <p className="text-foreground">Texto principal (Cinza Escuro)</p>
          <p className="text-muted-foreground">Texto secundário/muted (Cinza Médio)</p>
          <p className="text-primary font-semibold">Texto destaque (Azul Primária)</p>
          <p className="text-secondary font-semibold">Texto accent (Amarelo)</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="border-l-4 border-primary bg-primary/10 p-4 rounded">
        <h3 className="font-bold text-primary mb-2">📐 Design Tokens</h3>
        <p className="text-sm text-muted-foreground">
          Tokens e variáveis CSS estão em <code className="bg-muted px-2 py-1 rounded">src/lib/design-tokens.ts</code>
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Variáveis CSS em <code className="bg-muted px-2 py-1 rounded">src/index.css</code>
        </p>
      </div>
    </div>
  );
};

export default BrandShowcase;
