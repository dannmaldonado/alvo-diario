/**
 * 404 Not Found Page
 * Shown when the user navigates to a route that does not exist.
 */

import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Pagina nao encontrada - Alvo Diario</title>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <h1 className="text-7xl font-extrabold text-primary mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-8 text-center">
          Pagina nao encontrada. O endereco pode estar incorreto ou a pagina foi removida.
        </p>
        <Link to="/">
          <Button size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Home
          </Button>
        </Link>
      </div>
    </>
  );
};

export default NotFound;
