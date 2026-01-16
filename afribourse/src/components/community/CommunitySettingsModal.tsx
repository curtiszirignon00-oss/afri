// src/components/community/CommunitySettingsModal.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2, Trash2, AlertTriangle, Globe, Lock, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    useUpdateCommunity,
    useDeleteCommunity,
    COMMUNITY_CATEGORIES,
    type Community,
    type CommunityVisibility,
} from '../../hooks/useCommunity';

interface Props {
    community: Community;
    onClose: () => void;
}

export default function CommunitySettingsModal({ community, onClose }: Props) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'general' | 'danger'>('general');
    const [confirmDelete, setConfirmDelete] = useState('');

    const [formData, setFormData] = useState({
        name: community.name,
        description: community.description || '',
        visibility: community.visibility,
        category: community.category || '',
        settings: {
            require_post_approval: community.settings?.require_post_approval || false,
            allow_invitations: community.settings?.allow_invitations !== false,
        },
    });

    const updateCommunity = useUpdateCommunity();
    const deleteCommunity = useDeleteCommunity();

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Le nom est requis');
            return;
        }

        try {
            await updateCommunity.mutateAsync({
                communityId: community.id,
                data: formData,
            });
            toast.success('Communaute mise a jour');
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur');
        }
    };

    const handleDelete = async () => {
        if (confirmDelete !== community.name) {
            toast.error('Le nom ne correspond pas');
            return;
        }

        try {
            await deleteCommunity.mutateAsync(community.id);
            toast.success('Communaute supprimee');
            navigate('/communities');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur');
        }
    };

    const visibilityOptions: { value: CommunityVisibility; label: string; icon: JSX.Element }[] = [
        { value: 'PUBLIC', label: 'Publique', icon: <Globe className="w-4 h-4 text-green-500" /> },
        { value: 'PRIVATE', label: 'Privee', icon: <Lock className="w-4 h-4 text-yellow-500" /> },
        { value: 'SECRET', label: 'Secrete', icon: <Shield className="w-4 h-4 text-red-500" /> },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">Parametres</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 py-3 font-medium text-sm ${
                            activeTab === 'general'
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500'
                        }`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('danger')}
                        className={`flex-1 py-3 font-medium text-sm ${
                            activeTab === 'danger'
                                ? 'text-red-600 border-b-2 border-red-600'
                                : 'text-gray-500'
                        }`}
                    >
                        Zone de danger
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[60vh] p-4">
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Visibility */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Visibilite
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {visibilityOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() =>
                                                setFormData({ ...formData, visibility: option.value })
                                            }
                                            className={`p-3 border rounded-lg text-center transition-colors ${
                                                formData.visibility === option.value
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex justify-center mb-1">{option.icon}</div>
                                            <span className="text-sm font-medium">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Categorie
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category: e.target.value })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="">Selectionner</option>
                                    {COMMUNITY_CATEGORIES.map((cat) => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Settings */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Parametres
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.settings.require_post_approval}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    settings: {
                                                        ...formData.settings,
                                                        require_post_approval: e.target.checked,
                                                    },
                                                })
                                            }
                                            className="w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">
                                                Moderation des posts
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Les posts doivent etre approuves
                                            </p>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.settings.allow_invitations}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    settings: {
                                                        ...formData.settings,
                                                        allow_invitations: e.target.checked,
                                                    },
                                                })
                                            }
                                            className="w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">
                                                Autoriser les invitations
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Les membres peuvent inviter
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Danger Tab */}
                    {activeTab === 'danger' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center gap-2 text-red-600 mb-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="font-semibold">Supprimer la communaute</span>
                                </div>
                                <p className="text-sm text-red-600 mb-4">
                                    Cette action est irreversible. Tous les membres, posts et
                                    commentaires seront supprimes.
                                </p>

                                <p className="text-sm text-gray-700 mb-2">
                                    Tapez <strong>{community.name}</strong> pour confirmer:
                                </p>
                                <input
                                    type="text"
                                    value={confirmDelete}
                                    onChange={(e) => setConfirmDelete(e.target.value)}
                                    placeholder={community.name}
                                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-3"
                                />
                                <button
                                    onClick={handleDelete}
                                    disabled={
                                        confirmDelete !== community.name || deleteCommunity.isPending
                                    }
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleteCommunity.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    Supprimer definitivement
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {activeTab === 'general' && (
                    <div className="flex items-center justify-end gap-3 p-4 border-t">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={updateCommunity.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {updateCommunity.isPending && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            Enregistrer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
