# Guide d'Intégration Frontend - Confirmation d'Email

## 📋 Vue d'ensemble

Ce guide explique comment intégrer le système de confirmation d'email dans votre frontend React/Vue/Angular.

## 🛣️ Routes Frontend à créer

### 1. Page de confirmation d'inscription
**Route:** \`/confirmer-inscription\`

Cette page doit:
- Récupérer le token depuis l'URL (\`?token=xxx\`)
- Appeler l'API de confirmation
- Afficher le résultat (succès, erreur, déjà confirmé)
- Rediriger vers la page de connexion après succès

### 2. Page de renvoi de confirmation
**Route:** \`/renvoyer-confirmation\` (optionnel)

Cette page permet aux utilisateurs de demander un nouveau lien de confirmation.

## 💻 Exemples de Code

### React avec React Router

#### 1. Page de Confirmation (\`ConfirmEmailPage.tsx\`)

\`\`\`tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const ConfirmEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Token de confirmation manquant.');
        return;
      }

      try {
        const response = await axios.get(\`\${import.meta.env.VITE_API_URL}/api/auth/confirm-email\`, {
          params: { token }
        });

        if (response.data.alreadyVerified) {
          setStatus('already-verified');
          setMessage(response.data.message);
        } else {
          setStatus('success');
          setMessage(response.data.message);
          // Rediriger vers la page de connexion après 3 secondes
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Une erreur est survenue lors de la confirmation.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Confirmation de votre email en cours...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Email confirmé !</h3>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            <p className="mt-4 text-sm text-gray-500">Redirection vers la page de connexion...</p>
          </div>
        )}

        {status === 'already-verified' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Déjà confirmé</h3>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 w-full bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700"
            >
              Aller à la connexion
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Erreur de confirmation</h3>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            <button
              onClick={() => navigate('/renvoyer-confirmation')}
              className="mt-6 w-full bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700"
            >
              Renvoyer l'email de confirmation
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmailPage;
\`\`\`

#### 2. Page de Renvoi de Confirmation (\`ResendConfirmationPage.tsx\`)

\`\`\`tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResendConfirmationPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await axios.post(
        \`\${import.meta.env.VITE_API_URL}/api/auth/resend-confirmation\`,
        { email }
      );

      setStatus('success');
      setMessage(response.data.message);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Une erreur est survenue.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Renvoyer l'email de confirmation
        </h2>

        {status === 'success' ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mt-4 text-sm text-gray-600">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 w-full bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700"
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="votre@email.com"
              />
            </div>

            {status === 'error' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Envoi en cours...' : 'Renvoyer l\'email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResendConfirmationPage;
\`\`\`

#### 3. Mise à jour de la page d'inscription

Modifiez votre page d'inscription pour afficher un message après l'inscription réussie:

\`\`\`tsx
// Dans votre composant d'inscription
const handleRegister = async (data: RegisterData) => {
  try {
    const response = await axios.post(
      \`\${import.meta.env.VITE_API_URL}/api/auth/register\`,
      data
    );

    // Afficher un message de succès
    if (response.data.emailSent) {
      // Afficher une notification ou rediriger vers une page d'information
      navigate('/verifier-email', {
        state: { email: data.email }
      });
    }
  } catch (error: any) {
    // Gérer les erreurs
    console.error(error.response?.data?.error);
  }
};
\`\`\`

#### 4. Page d'information post-inscription (\`VerifyEmailPage.tsx\`)

\`\`\`tsx
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Vérifiez votre email
          </h2>

          <p className="mt-4 text-gray-600">
            Un email de confirmation a été envoyé à:
          </p>
          <p className="mt-2 text-lg font-semibold text-blue-600">
            {email}
          </p>

          <div className="mt-6 text-sm text-gray-500 space-y-2">
            <p>Cliquez sur le lien dans l'email pour confirmer votre compte.</p>
            <p>Le lien expire dans 24 heures.</p>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate('/renvoyer-confirmation')}
              className="w-full bg-white text-blue-600 border border-blue-600 rounded-md px-4 py-2 hover:bg-blue-50"
            >
              Vous n'avez pas reçu l'email ?
            </button>

            <button
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
\`\`\`

#### 5. Mise à jour du Router

\`\`\`tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ConfirmEmailPage from './pages/ConfirmEmailPage';
import ResendConfirmationPage from './pages/ResendConfirmationPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... autres routes ... */}
        <Route path="/confirmer-inscription" element={<ConfirmEmailPage />} />
        <Route path="/renvoyer-confirmation" element={<ResendConfirmationPage />} />
        <Route path="/verifier-email" element={<VerifyEmailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
\`\`\`

## 🎨 Gestion des erreurs de connexion

Mettez à jour votre page de connexion pour gérer l'erreur "email non vérifié":

\`\`\`tsx
const handleLogin = async (data: LoginData) => {
  try {
    const response = await axios.post(
      \`\${import.meta.env.VITE_API_URL}/api/auth/login\`,
      data
    );
    // Connexion réussie
  } catch (error: any) {
    const errorMessage = error.response?.data?.error;

    if (errorMessage?.includes('confirmer votre adresse email')) {
      // Rediriger vers la page de renvoi de confirmation
      navigate('/renvoyer-confirmation', {
        state: { email: data.email }
      });
    } else {
      // Afficher l'erreur
      setError(errorMessage || 'Erreur de connexion');
    }
  }
};
\`\`\`

## ⚙️ Variables d'environnement

Ajoutez dans votre \`.env\`:

\`\`\`env
VITE_API_URL=http://localhost:3001
\`\`\`

## 📱 Version mobile (React Native)

Pour React Native, utilisez une Deep Link pour gérer la confirmation:

\`\`\`tsx
import { useEffect } from 'react';
import { Linking } from 'react-native';

useEffect(() => {
  const handleDeepLink = (event: { url: string }) => {
    const url = event.url;
    if (url.includes('/confirmer-inscription')) {
      const token = url.split('token=')[1];
      // Appeler l'API de confirmation
    }
  };

  Linking.addEventListener('url', handleDeepLink);

  return () => {
    Linking.removeEventListener('url', handleDeepLink);
  };
}, []);
\`\`\`

## ✅ Checklist d'intégration

- [ ] Créer la page de confirmation d'email
- [ ] Créer la page de renvoi de confirmation
- [ ] Créer la page d'information post-inscription
- [ ] Mettre à jour la page d'inscription
- [ ] Mettre à jour la page de connexion (gestion erreur email non vérifié)
- [ ] Ajouter les routes dans le router
- [ ] Configurer la variable d'environnement VITE_API_URL
- [ ] Tester le flux complet

---

**Bon développement !** 🚀
