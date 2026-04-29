import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle, AlertCircle, Loader2, Bot, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api-client';
import { metaPixel } from '../utils/metaPixel';

type Status = 'idle' | 'loading' | 'success' | 'already_claimed' | 'error' | 'not_logged_in';

export default function TrialClaimPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isLoggedIn, loading: authLoading, checkAuth } = useAuth();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<Status>('idle');
    const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Attendre que le check d'auth initial soit terminé
        if (authLoading) return;

        if (!token) {
            setStatus('error');
            setErrorMessage('Lien invalide. Vérifiez votre email.');
            return;
        }

        if (!isLoggedIn) {
            setStatus('not_logged_in');
            return;
        }

        activateTrial();
    }, [isLoggedIn, authLoading, token]);

    async function activateTrial() {
        setStatus('loading');
        try {
            const res = await apiClient.post(`/trial/claim/${token}`);
            const data = res.data;

            if (data.alreadyClaimed) {
                setStatus('already_claimed');
                setTrialExpiresAt(data.data?.expiresAt ?? null);
            } else {
                setStatus('success');
                setTrialExpiresAt(data.data?.expiresAt ?? null);
                metaPixel.startTrial();
                metaPixel.lead('trial_claim');
                // Rafraîchir le profil utilisateur pour mettre à jour subscriptionTier
                await checkAuth();
            }
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(
                err?.response?.data?.message ?? 'Une erreur est survenue. Réessayez.'
            );
        }
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <TrendingUp className="w-8 h-8 text-orange-500" />
                        <span className="text-2xl font-bold text-gray-900">AfriBourse</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* LOADING */}
                    {status === 'loading' && (
                        <div className="text-center space-y-4">
                            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto" />
                            <h2 className="text-xl font-bold text-gray-900">Activation en cours…</h2>
                            <p className="text-gray-500">Nous activons votre accès IA.</p>
                        </div>
                    )}

                    {/* SUCCESS */}
                    {status === 'success' && (
                        <div className="text-center space-y-5">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Accès activé ! 🎉
                                </h2>
                                {trialExpiresAt && (
                                    <p className="text-gray-600">
                                        Votre essai gratuit est valide jusqu'au{' '}
                                        <strong className="text-blue-600">{formatDate(trialExpiresAt)}</strong>
                                    </p>
                                )}
                            </div>

                            {/* Features */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 text-left space-y-3">
                                <div className="flex items-start gap-3">
                                    <Bot className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-900">SIMBA — Assistant IA boursier</p>
                                        <p className="text-sm text-gray-600">Analyses de marché BRVM, réponses instantanées</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-6 h-6 text-purple-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-gray-900">Conseiller Financier IA</p>
                                        <p className="text-sm text-gray-600">Analyse de votre portefeuille & recommandations</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                            >
                                Accéder à mon tableau de bord →
                            </button>
                        </div>
                    )}

                    {/* ALREADY CLAIMED */}
                    {status === 'already_claimed' && (
                        <div className="text-center space-y-5">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-12 h-12 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Essai déjà activé
                                </h2>
                                {trialExpiresAt && new Date() < new Date(trialExpiresAt) ? (
                                    <p className="text-gray-600">
                                        Votre accès est actif jusqu'au{' '}
                                        <strong className="text-blue-600">{formatDate(trialExpiresAt)}</strong>
                                    </p>
                                ) : (
                                    <p className="text-gray-600">Votre période d'essai est terminée.</p>
                                )}
                            </div>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                            >
                                Retour au tableau de bord
                            </button>
                        </div>
                    )}

                    {/* NOT LOGGED IN */}
                    {status === 'not_logged_in' && (
                        <div className="text-center space-y-5">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                                <Sparkles className="w-12 h-12 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Essai gratuit — 14 jours IA
                                </h2>
                                <p className="text-gray-600">
                                    Connectez-vous à votre compte AfriBourse pour activer votre accès gratuit à SIMBA et au Conseiller Financier IA.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/essai-gratuit?token=${token}`)}`)}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                                >
                                    Se connecter
                                </button>
                                <button
                                    onClick={() => navigate(`/signup?redirect=${encodeURIComponent(`/essai-gratuit?token=${token}`)}`)}
                                    className="w-full py-3 px-6 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all"
                                >
                                    Créer un compte
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ERROR */}
                    {status === 'error' && (
                        <div className="text-center space-y-5">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-12 h-12 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Lien invalide
                                </h2>
                                <p className="text-gray-600">{errorMessage}</p>
                            </div>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                            >
                                Retour à l'accueil
                            </button>
                        </div>
                    )}

                    {/* IDLE / auth loading */}
                    {(status === 'idle' || authLoading) && (
                        <div className="text-center py-6">
                            <Loader2 className="w-10 h-10 text-gray-300 animate-spin mx-auto" />
                            <p className="text-sm text-gray-400 mt-3">Vérification en cours…</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
