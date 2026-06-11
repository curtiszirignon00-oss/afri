// src/components/community/CommunityPostComposer.tsx
import { useState } from 'react';
import { Send, Loader2, Plus, Trash2, CheckSquare, BarChart2, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCreateCommunityPost, type PostType, type TaskItem, type SurveyMeta } from '../../hooks/useCommunity';
import { v4 as uuidv4 } from 'uuid';

interface Props {
    communityId: string;
    canModerate?: boolean;
}

const STANDARD_TYPES: { value: PostType; label: string }[] = [
    { value: 'OPINION', label: 'Opinion' },
    { value: 'ANALYSIS', label: 'Analyse' },
    { value: 'QUESTION', label: 'Question' },
    { value: 'TRANSACTION', label: 'Transaction' },
    { value: 'ARTICLE', label: 'Article' },
];

export default function CommunityPostComposer({ communityId, canModerate }: Props) {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [type, setType] = useState<PostType>('OPINION');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Task list state
    const [taskItems, setTaskItems] = useState<TaskItem[]>([{ id: uuidv4(), text: '', order: 0 }]);

    // Survey state
    const [surveyType, setSurveyType] = useState<'multiple_choice' | 'open'>('multiple_choice');
    const [surveyQuestion, setSurveyQuestion] = useState('');
    const [surveyOptions, setSurveyOptions] = useState<string[]>(['', '']);

    const createPost = useCreateCommunityPost();

    const resetForm = () => {
        setContent('');
        setTitle('');
        setType('OPINION');
        setShowAdvanced(false);
        setTaskItems([{ id: uuidv4(), text: '', order: 0 }]);
        setSurveyQuestion('');
        setSurveyOptions(['', '']);
        setSurveyType('multiple_choice');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let metadata: any = undefined;

        if (type === 'TASK_LIST') {
            const validTasks = taskItems.filter((t) => t.text.trim());
            if (validTasks.length === 0) {
                toast.error('Ajoutez au moins une tâche');
                return;
            }
            if (!content.trim()) {
                toast.error('Ajoutez une description à la liste');
                return;
            }
            metadata = { tasks: validTasks };
        } else if (type === 'SURVEY') {
            if (!surveyQuestion.trim()) {
                toast.error('Ajoutez une question');
                return;
            }
            if (surveyType === 'multiple_choice') {
                const validOpts = surveyOptions.filter((o) => o.trim());
                if (validOpts.length < 2) {
                    toast.error('Ajoutez au moins 2 options');
                    return;
                }
                metadata = { survey: { survey_type: 'multiple_choice', question: surveyQuestion.trim(), options: validOpts, responses_public: false } as SurveyMeta };
            } else {
                metadata = { survey: { survey_type: 'open', question: surveyQuestion.trim(), responses_public: false } as SurveyMeta };
            }
            if (!content.trim()) {
                toast.error('Ajoutez un contexte/description');
                return;
            }
        } else if (!content.trim()) {
            toast.error('Le contenu est requis');
            return;
        }

        try {
            await createPost.mutateAsync({
                communityId,
                data: {
                    type,
                    content: content.trim(),
                    title: title.trim() || undefined,
                    metadata,
                },
            });
            toast.success('Publication créée !');
            resetForm();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de la publication');
        }
    };

    // --- Task list helpers ---
    const addTask = () =>
        setTaskItems((prev) => [...prev, { id: uuidv4(), text: '', order: prev.length }]);

    const updateTask = (id: string, text: string) =>
        setTaskItems((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));

    const removeTask = (id: string) =>
        setTaskItems((prev) => prev.filter((t) => t.id !== id).map((t, i) => ({ ...t, order: i })));

    // --- Survey helpers ---
    const addOption = () => setSurveyOptions((prev) => [...prev, '']);
    const updateOption = (i: number, val: string) =>
        setSurveyOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
    const removeOption = (i: number) =>
        setSurveyOptions((prev) => prev.filter((_, idx) => idx !== i));

    return (
        <div className="bg-white rounded-xl shadow-sm p-4">
            <form onSubmit={handleSubmit}>
                {/* Type selector — types standard */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {STANDARD_TYPES.map((postType) => (
                        <button
                            key={postType.value}
                            type="button"
                            onClick={() => setType(postType.value)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                type === postType.value
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {postType.label}
                        </button>
                    ))}

                    {/* Types spéciaux — admin/modérateur uniquement */}
                    {canModerate && (
                        <>
                            <button
                                type="button"
                                onClick={() => setType('TASK_LIST')}
                                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                    type === 'TASK_LIST'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <CheckSquare className="w-3 h-3" /> Tâches
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('SURVEY')}
                                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                    type === 'SURVEY'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <BarChart2 className="w-3 h-3" /> Sondage
                            </button>
                        </>
                    )}
                </div>

                {/* Titre optionnel (sauf TASK_LIST / SURVEY où on l'affiche toujours) */}
                {(showAdvanced || type === 'TASK_LIST' || type === 'SURVEY') && (
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Titre (optionnel)"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                )}

                {/* Description / contexte (toujours visible) */}
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={
                        type === 'TASK_LIST'
                            ? 'Description de la liste de tâches…'
                            : type === 'SURVEY'
                            ? 'Contexte du sondage (optionnel)…'
                            : 'Partagez quelque chose avec la communauté…'
                    }
                    rows={type === 'TASK_LIST' || type === 'SURVEY' ? 2 : 3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />

                {/* === TASK LIST BUILDER === */}
                {type === 'TASK_LIST' && (
                    <div className="mt-3 border border-green-100 rounded-xl overflow-hidden">
                        <div className="bg-green-50 px-3 py-2 flex items-center gap-2 border-b border-green-100">
                            <CheckSquare className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Tâches</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {taskItems.map((task, idx) => (
                                <div key={task.id} className="flex items-center gap-2 px-3 py-2">
                                    <span className="text-xs text-gray-400 w-5 flex-shrink-0">{idx + 1}.</span>
                                    <input
                                        type="text"
                                        value={task.text}
                                        onChange={(e) => updateTask(task.id, e.target.value)}
                                        placeholder={`Tâche ${idx + 1}…`}
                                        className="flex-1 text-sm border-0 focus:ring-0 outline-none bg-transparent"
                                    />
                                    {taskItems.length > 1 && (
                                        <button type="button" onClick={() => removeTask(task.id)}>
                                            <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addTask}
                            className="w-full flex items-center justify-center gap-1 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors border-t border-green-100"
                        >
                            <Plus className="w-3.5 h-3.5" /> Ajouter une tâche
                        </button>
                    </div>
                )}

                {/* === SURVEY BUILDER === */}
                {type === 'SURVEY' && (
                    <div className="mt-3 border border-purple-100 rounded-xl overflow-hidden">
                        <div className="bg-purple-50 px-3 py-2 flex items-center gap-3 border-b border-purple-100">
                            <BarChart2 className="w-4 h-4 text-purple-600" />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSurveyType('multiple_choice')}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                        surveyType === 'multiple_choice'
                                            ? 'bg-purple-200 text-purple-800'
                                            : 'text-purple-500 hover:bg-purple-100'
                                    }`}
                                >
                                    <BarChart2 className="w-3 h-3" /> Choix multiple
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSurveyType('open')}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                        surveyType === 'open'
                                            ? 'bg-purple-200 text-purple-800'
                                            : 'text-purple-500 hover:bg-purple-100'
                                    }`}
                                >
                                    <MessageSquare className="w-3 h-3" /> Réponse libre
                                </button>
                            </div>
                        </div>

                        <div className="px-3 py-3">
                            <input
                                type="text"
                                value={surveyQuestion}
                                onChange={(e) => setSurveyQuestion(e.target.value)}
                                placeholder="Votre question…"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent mb-2"
                            />

                            {surveyType === 'multiple_choice' && (
                                <div className="space-y-2">
                                    {surveyOptions.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="w-5 h-5 flex-shrink-0 rounded-full border border-gray-300 flex items-center justify-center text-xs text-gray-400">
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => updateOption(i, e.target.value)}
                                                placeholder={`Option ${i + 1}…`}
                                                className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                                            />
                                            {surveyOptions.length > 2 && (
                                                <button type="button" onClick={() => removeOption(i)}>
                                                    <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {surveyOptions.length < 6 && (
                                        <button
                                            type="button"
                                            onClick={addOption}
                                            className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 transition-colors mt-1"
                                        >
                                            <Plus className="w-3 h-3" /> Ajouter une option
                                        </button>
                                    )}
                                </div>
                            )}

                            {surveyType === 'open' && (
                                <p className="text-xs text-gray-400 italic">
                                    Les membres pourront écrire une réponse libre. Vous verrez toutes les réponses en tant qu'admin, et pourrez les rendre publiques quand vous le souhaitez.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-3">
                    {type !== 'TASK_LIST' && type !== 'SURVEY' ? (
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            {showAdvanced ? "Moins d'options" : "Plus d'options"}
                        </button>
                    ) : (
                        <span />
                    )}

                    <button
                        type="submit"
                        disabled={createPost.isPending}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {createPost.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Publier
                    </button>
                </div>
            </form>
        </div>
    );
}
