// src/components/community/CreateCommunityModal.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Trash2, Loader2, Globe, Lock, Shield, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    useCreateCommunity,
    COMMUNITY_CATEGORIES,
    type CreateCommunityData,
    type CommunityVisibility,
    type CommunityRule,
} from '../../hooks/useCommunity';

interface Props {
    onClose: () => void;
}

export default function CreateCommunityModal({ onClose }: Props) {
    const navigate = useNavigate();
    const createCommunity = useCreateCommunity();

    const [formData, setFormData] = useState<CreateCommunityData>({
        name: '',
        description: '',
        visibility: 'PUBLIC',
        category: '',
        tags: [],
        rules: [],
        settings: {
            allow_posts: true,
            require_post_approval: false,
            min_level: 0,
            allow_invitations: true,
        },
    });

    const [tagInput, setTagInput] = useState('');
    const [newRule, setNewRule] = useState<CommunityRule>({ title: '', description: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Le nom de la communaute est requis');
            return;
        }

        try {
            const community = await createCommunity.mutateAsync(formData);
            toast.success('Communaute creee avec succes!');
            onClose();
            navigate(`/communities/${community.slug}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de la creation');
        }
    };

    const addTag = () => {
        if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...(formData.tags || []), tagInput.trim()],
            });
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setFormData({
            ...formData,
            tags: formData.tags?.filter((t) => t !== tag),
        });
    };

    const addRule = () => {
        if (newRule.title.trim() && newRule.description.trim()) {
            setFormData({
                ...formData,
                rules: [...(formData.rules || []), newRule],
            });
            setNewRule({ title: '', description: '' });
        }
    };

    const removeRule = (index: number) => {
        setFormData({
            ...formData,
            rules: formData.rules?.filter((_, i) => i !== index),
        });
    };

    const visibilityOptions: { value: CommunityVisibility; label: string; description: string; icon: JSX.Element }[] = [
        {
            value: 'PUBLIC',
            label: 'Publique',
            description: 'Tout le monde peut voir et rejoindre',
            icon: <Globe className="w-5 h-5 text-green-500" />,
        },
        {
            value: 'PRIVATE',
            label: 'Privee',
            description: 'Visible mais necessite une approbation',
            icon: <Lock className="w-5 h-5 text-yellow-500" />,
        },
        {
            value: 'SECRET',
            label: 'Secrete',
            description: 'Invisible, uniquement sur invitation',
            icon: <Shield className="w-5 h-5 text-red-500" />,
        },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Creer une communaute</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-160px)]">
                    <div className="p-6 space-y-6">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nom de la communaute *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Investisseurs BRVM"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Decrivez votre communaute..."
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                            />
                        </div>

                        {/* Visibility */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Visibilite
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {visibilityOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, visibility: option.value })}
                                        className={`p-4 border rounded-xl text-left transition-colors ${
                                            formData.visibility === option.value
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            {option.icon}
                                            <span className="font-medium text-gray-900">{option.label}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">{option.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Categorie
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">Selectionner une categorie</option>
                                {COMMUNITY_CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tags
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                    placeholder="Ajouter un tag"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            {formData.tags && formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="hover:text-indigo-800"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Rules */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Regles de la communaute
                            </label>

                            {/* Existing Rules */}
                            {formData.rules && formData.rules.length > 0 && (
                                <div className="space-y-2 mb-4">
                                    {formData.rules.map((rule, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                                        >
                                            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{rule.title}</p>
                                                <p className="text-sm text-gray-600">{rule.description}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeRule(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Rule */}
                            <div className="p-4 border border-dashed border-gray-300 rounded-xl">
                                <input
                                    type="text"
                                    value={newRule.title}
                                    onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                                    placeholder="Titre de la regle"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <textarea
                                    value={newRule.description}
                                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                                    placeholder="Description de la regle"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                />
                                <button
                                    type="button"
                                    onClick={addRule}
                                    disabled={!newRule.title.trim() || !newRule.description.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" />
                                    Ajouter la regle
                                </button>
                            </div>
                        </div>

                        {/* Settings */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Parametres
                            </label>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.settings?.require_post_approval}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                settings: {
                                                    ...formData.settings,
                                                    require_post_approval: e.target.checked,
                                                },
                                            })
                                        }
                                        className="w-5 h-5 text-indigo-600 rounded"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">Moderation des posts</p>
                                        <p className="text-sm text-gray-500">
                                            Les posts doivent etre approuves par un admin
                                        </p>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.settings?.allow_invitations}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                settings: {
                                                    ...formData.settings,
                                                    allow_invitations: e.target.checked,
                                                },
                                            })
                                        }
                                        className="w-5 h-5 text-indigo-600 rounded"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">Autoriser les invitations</p>
                                        <p className="text-sm text-gray-500">
                                            Les membres peuvent inviter d'autres utilisateurs
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={createCommunity.isPending || !formData.name.trim()}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {createCommunity.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Creer la communaute
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
