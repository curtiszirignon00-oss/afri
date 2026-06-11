// src/components/community/CommunitySurveyBlock.tsx
import { useState } from 'react';
import {
    useSurveyResponses,
    useSubmitSurveyResponse,
    useToggleSurveyPublic,
    type SurveyMeta,
    type SurveyResponse,
} from '../../hooks/useCommunity';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Send, Eye, EyeOff, BarChart2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
    postId: string;
    survey: SurveyMeta;
    canModerate?: boolean;
    authorId: string;
}

export default function CommunitySurveyBlock({ postId, survey, canModerate, authorId }: Props) {
    const { isLoggedIn, userProfile } = useAuth();
    const [showResponses, setShowResponses] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [openAnswer, setOpenAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const isManager = canModerate || userProfile?.id === authorId;

    const { data: responsesData, isLoading: loadingResponses } = useSurveyResponses(postId, showResponses || isManager);
    const submitResponse = useSubmitSurveyResponse(postId);
    const togglePublic = useToggleSurveyPublic(postId);

    const responses = responsesData?.responses ?? [];
    const isPublic = responsesData?.is_public ?? survey.responses_public;
    const myResponse = responses.find((r) => r.user_id === userProfile?.id);
    const hasAnswered = submitted || !!myResponse;

    const handleSubmit = async () => {
        if (!isLoggedIn) {
            toast.error('Connectez-vous pour répondre');
            return;
        }
        const answer =
            survey.survey_type === 'multiple_choice'
                ? { option_index: selectedOption ?? undefined }
                : { text: openAnswer.trim() };

        if (survey.survey_type === 'multiple_choice' && selectedOption === null) {
            toast.error('Sélectionnez une option');
            return;
        }
        if (survey.survey_type === 'open' && !openAnswer.trim()) {
            toast.error('Écrivez votre réponse');
            return;
        }

        try {
            await submitResponse.mutateAsync(answer);
            setSubmitted(true);
            toast.success('Réponse envoyée !');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erreur');
        }
    };

    const handleTogglePublic = async () => {
        try {
            const result = await togglePublic.mutateAsync();
            toast.success(result.responses_public ? 'Réponses rendues publiques' : 'Réponses masquées');
        } catch {
            toast.error('Erreur');
        }
    };

    // Calcul des votes pour QCM
    const voteCounts = survey.options?.map((_, i) =>
        responses.filter((r) => (r.answer as any).option_index === i).length
    ) ?? [];
    const totalVotes = voteCounts.reduce((a, b) => a + b, 0);

    return (
        <div className="mt-3 border border-indigo-100 rounded-xl overflow-hidden bg-indigo-50/30">
            <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {survey.survey_type === 'multiple_choice' ? (
                        <BarChart2 className="w-4 h-4 text-indigo-600" />
                    ) : (
                        <MessageSquare className="w-4 h-4 text-indigo-600" />
                    )}
                    <span className="text-sm font-semibold text-indigo-800">
                        {survey.survey_type === 'multiple_choice' ? 'Sondage' : 'Question ouverte'}
                    </span>
                </div>
                {isManager && (
                    <button
                        onClick={handleTogglePublic}
                        disabled={togglePublic.isPending}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
                        title={isPublic ? 'Masquer les réponses' : 'Rendre les réponses publiques'}
                    >
                        {togglePublic.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isPublic ? (
                            <><EyeOff className="w-3 h-3" /> Masquer</>
                        ) : (
                            <><Eye className="w-3 h-3" /> Publier les réponses</>
                        )}
                    </button>
                )}
            </div>

            <div className="px-4 py-3">
                {/* Question */}
                <p className="text-sm font-medium text-gray-900 mb-3">{survey.question}</p>

                {/* Input zone — caché si déjà répondu */}
                {!hasAnswered ? (
                    <>
                        {survey.survey_type === 'multiple_choice' && survey.options ? (
                            <div className="space-y-2 mb-3">
                                {survey.options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedOption(i)}
                                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                                            selectedOption === i
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                                                : 'border-gray-200 bg-white hover:border-indigo-300 text-gray-700'
                                        }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <textarea
                                value={openAnswer}
                                onChange={(e) => setOpenAnswer(e.target.value)}
                                placeholder="Écrivez votre réponse…"
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-3"
                            />
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={submitResponse.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {submitResponse.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Répondre
                        </button>
                    </>
                ) : (
                    <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-2">
                        ✓ Vous avez répondu à ce sondage
                    </div>
                )}

                {/* Résultats — visibles si public OU manager */}
                {(isPublic || isManager) && (
                    <div className="mt-2">
                        <button
                            onClick={() => setShowResponses((v) => !v)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            {showResponses ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            {isManager && !isPublic && '(Admin) '}
                            Voir les réponses {responsesData?.total != null && `(${responsesData.total})`}
                        </button>

                        {showResponses && (
                            <div className="mt-3 space-y-2">
                                {loadingResponses ? (
                                    <div className="flex justify-center py-3">
                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                    </div>
                                ) : survey.survey_type === 'multiple_choice' && survey.options ? (
                                    // Affichage QCM : barres de progression
                                    <div className="space-y-2">
                                        {survey.options.map((opt, i) => {
                                            const count = voteCounts[i] ?? 0;
                                            const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                                            return (
                                                <div key={i}>
                                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                        <span>{opt}</span>
                                                        <span>{count} vote{count !== 1 ? 's' : ''} ({pct}%)</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <p className="text-xs text-gray-400">{totalVotes} réponse{totalVotes !== 1 ? 's' : ''} au total</p>
                                    </div>
                                ) : (
                                    // Affichage question ouverte
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {responses.length === 0 ? (
                                            <p className="text-xs text-gray-400">Aucune réponse pour l'instant</p>
                                        ) : (
                                            responses.map((r: SurveyResponse) => (
                                                <div key={r.id} className="bg-white border border-gray-100 rounded-lg px-3 py-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                            {r.user.profile?.avatar_url ? (
                                                                <img src={r.user.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs flex items-center justify-center h-full font-medium text-gray-600">
                                                                    {r.user.name[0]}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-700">
                                                            {r.user.profile?.username || `${r.user.name} ${r.user.lastname}`}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-800">{(r.answer as any).text}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Message pour les membres si réponses non publiques */}
                {!isPublic && !isManager && hasAnswered && (
                    <p className="text-xs text-gray-400 mt-2">
                        Les résultats seront visibles quand l'admin les rendra publics.
                    </p>
                )}
            </div>
        </div>
    );
}
