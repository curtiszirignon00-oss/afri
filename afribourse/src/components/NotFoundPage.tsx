import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

// Route catch-all : sans elle, une URL inconnue rendait une page vide en 200,
// que Google classait en doublon / soft 404.
export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <Helmet>
        <title>Page introuvable | AfriBourse</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <p className="text-6xl font-extrabold text-slate-300 mb-4">404</p>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Page introuvable</h1>
      <p className="text-slate-500 mb-6">Cette page n'existe pas ou a été déplacée.</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/" className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">
          Accueil
        </Link>
        <Link to="/markets" className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50">
          Marchés BRVM
        </Link>
      </div>
    </div>
  );
}
