// src/components/profile/EditProfileModal.tsx
import { useState, useEffect } from 'react';
import { X, Loader2, Globe, Linkedin, Twitter, Instagram, Facebook } from 'lucide-react';
import { useUpdateProfile, type ProfileUpdateData } from '../../hooks/useUpload';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: any;
}

export default function EditProfileModal({ isOpen, onClose, profile }: EditProfileModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        lastname: '',
        username: '',
        bio: '',
        country: '',
        linkedin: '',
        twitter: '',
        website: '',
        instagram: '',
        facebook: '',
    });

    const { mutate: updateProfile, isPending } = useUpdateProfile();

    // Initialiser le formulaire avec les données du profil
    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                lastname: profile.lastname || '',
                username: profile.profile?.username || '',
                bio: profile.profile?.bio || '',
                country: profile.profile?.country || '',
                linkedin: profile.profile?.social_links?.linkedin || '',
                twitter: profile.profile?.social_links?.twitter || '',
                website: profile.profile?.social_links?.website || '',
                instagram: profile.profile?.social_links?.instagram || '',
                facebook: profile.profile?.social_links?.facebook || '',
            });
        }
    }, [profile]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation des usernames réservés (frontend)
        const reservedUsernames = ['afribourse', 'admin', 'administrator', 'support', 'official', 'help', 'contact', 'info', 'service', 'team'];
        if (formData.username.trim() && reservedUsernames.includes(formData.username.trim().toLowerCase())) {
            // Utiliser toast au lieu d'alert si disponible, sinon utiliser alert
            if (typeof window !== 'undefined') {
                alert('Ce nom d\'utilisateur est réservé et ne peut pas être utilisé');
            }
            return;
        }

        // Construire social_links seulement si au moins un champ est rempli
        const socialLinks: Record<string, string> = {};
        if (formData.linkedin) socialLinks.linkedin = formData.linkedin;
        if (formData.twitter) socialLinks.twitter = formData.twitter;
        if (formData.website) socialLinks.website = formData.website;
        if (formData.instagram) socialLinks.instagram = formData.instagram;
        if (formData.facebook) socialLinks.facebook = formData.facebook;

        const updateData: ProfileUpdateData = {};

        // N'envoyer que les champs qui ont une valeur
        if (formData.name.trim()) {
            updateData.name = formData.name.trim();
        }
        if (formData.lastname.trim()) {
            updateData.lastname = formData.lastname.trim();
        }
        if (formData.username.trim()) {
            updateData.username = formData.username.trim();
        }
        // Toujours envoyer bio (peut être vide)
        updateData.bio = formData.bio;
        if (formData.country) {
            updateData.country = formData.country;
        }
        if (Object.keys(socialLinks).length > 0) {
            updateData.social_links = socialLinks;
        }

        console.log('📝 [EDIT MODAL] Sending update data:', updateData);

        updateProfile(updateData, {
            onSuccess: () => {
                console.log('✅ [EDIT MODAL] Profile updated successfully');
                onClose();
            },
            onError: (error) => {
                console.error('❌ [EDIT MODAL] Update failed:', error);
            },
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Modifier le profil
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prénom
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Votre prénom"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={50}
                        />
                    </div>

                    {/* Lastname */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom de famille
                        </label>
                        <input
                            type="text"
                            value={formData.lastname}
                            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                            placeholder="Votre nom de famille"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={50}
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom d'utilisateur
                        </label>
                        <div className="flex items-center">
                            <span className="text-gray-500 mr-1">@</span>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                placeholder="votre_nom"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                maxLength={30}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Lettres, chiffres et underscores uniquement
                        </p>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bio
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Parlez-nous de vous..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            maxLength={200}
                        />
                        <p className="text-xs text-gray-500 mt-1 text-right">
                            {formData.bio.length}/200
                        </p>
                    </div>

                    {/* Country */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pays
                        </label>
                        <select
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Sélectionner un pays</option>
                            <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                            <option value="Sénégal">Sénégal</option>
                            <option value="Mali">Mali</option>
                            <option value="Burkina Faso">Burkina Faso</option>
                            <option value="Bénin">Bénin</option>
                            <option value="Togo">Togo</option>
                            <option value="Niger">Niger</option>
                            <option value="Guinée-Bissau">Guinée-Bissau</option>
                            <option value="France">France</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>

                    {/* Social Links */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Réseaux sociaux
                        </label>
                        <div className="space-y-3">
                            {/* LinkedIn */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Linkedin className="w-5 h-5 text-blue-700" />
                                </div>
                                <input
                                    type="url"
                                    value={formData.linkedin}
                                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                    placeholder="https://linkedin.com/in/..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Twitter/X */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Twitter className="w-5 h-5 text-gray-700" />
                                </div>
                                <input
                                    type="url"
                                    value={formData.twitter}
                                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                    placeholder="https://twitter.com/..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Instagram */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                                    <Instagram className="w-5 h-5 text-pink-600" />
                                </div>
                                <input
                                    type="url"
                                    value={formData.instagram}
                                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                    placeholder="https://instagram.com/..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Facebook */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Facebook className="w-5 h-5 text-blue-600" />
                                </div>
                                <input
                                    type="url"
                                    value={formData.facebook}
                                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                    placeholder="https://facebook.com/..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Website */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-green-600" />
                                </div>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://votre-site.com"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
