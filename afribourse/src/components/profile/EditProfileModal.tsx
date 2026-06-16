// src/components/profile/EditProfileModal.tsx
import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Globe, Linkedin, Twitter, Instagram, Facebook, Camera, Trash2, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    useUpdateProfile,
    useUploadAvatar,
    useUploadBanner,
    useDeleteImage,
    validateImageFile,
    type ProfileUpdateData,
} from '../../hooks/useUpload';

/** Extrait le nom de fichier d'une URL (dernier segment). */
function filenameFromUrl(url?: string | null): string | null {
    if (!url) return null;
    try {
        return new URL(url).pathname.split('/').pop() || null;
    } catch {
        return url.split('/').pop() || null;
    }
}

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
        avatar_color: '',
        banner_color: '',
        linkedin: '',
        twitter: '',
        website: '',
        instagram: '',
        facebook: '',
    });

    const { mutate: updateProfile, isPending } = useUpdateProfile();
    const uploadAvatar = useUploadAvatar();
    const uploadBanner = useUploadBanner();
    const deleteImage = useDeleteImage();

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    // Aperçus locaux (mis à jour en direct après upload)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);

    // Initialiser le formulaire avec les données du profil
    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                lastname: profile.lastname || '',
                username: profile.profile?.username || '',
                bio: profile.profile?.bio || '',
                country: profile.profile?.country || '',
                avatar_color: profile.profile?.avatar_color || 'from-blue-500 to-purple-600',
                banner_color: profile.profile?.banner_color || 'from-blue-600 via-indigo-600 to-purple-700',
                linkedin: profile.profile?.social_links?.linkedin || '',
                twitter: profile.profile?.social_links?.twitter || '',
                website: profile.profile?.social_links?.website || '',
                instagram: profile.profile?.social_links?.instagram || '',
                facebook: profile.profile?.social_links?.facebook || '',
            });
            setAvatarUrl(profile.profile?.avatar_url || null);
            setBannerUrl(profile.profile?.banner_url || null);
        }
    }, [profile]);

    const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (avatarInputRef.current) avatarInputRef.current.value = '';
        if (!file) return;
        const check = validateImageFile(file, { maxSizeMB: 5 });
        if (!check.valid) {
            toast.error(check.error || 'Fichier invalide');
            return;
        }
        try {
            const res = await uploadAvatar.mutateAsync(file);
            if (res.data.avatar_url) setAvatarUrl(res.data.avatar_url);
        } catch {
            /* toast géré par le hook */
        }
    };

    const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (bannerInputRef.current) bannerInputRef.current.value = '';
        if (!file) return;
        const check = validateImageFile(file, { maxSizeMB: 10 });
        if (!check.valid) {
            toast.error(check.error || 'Fichier invalide');
            return;
        }
        try {
            const res = await uploadBanner.mutateAsync(file);
            if (res.data.banner_url) setBannerUrl(res.data.banner_url);
        } catch {
            /* toast géré par le hook */
        }
    };

    const handleRemoveAvatar = async () => {
        const filename = filenameFromUrl(avatarUrl);
        if (!filename) return;
        try {
            await deleteImage.mutateAsync({ type: 'avatars', filename });
            setAvatarUrl(null);
        } catch {
            /* toast géré par le hook */
        }
    };

    const handleRemoveBanner = async () => {
        const filename = filenameFromUrl(bannerUrl);
        if (!filename) return;
        try {
            await deleteImage.mutateAsync({ type: 'banners', filename });
            setBannerUrl(null);
        } catch {
            /* toast géré par le hook */
        }
    };

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
        if (formData.avatar_color) {
            updateData.avatar_color = formData.avatar_color;
        }
        if (formData.banner_color) {
            updateData.banner_color = formData.banner_color;
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
                    {/* Photos : bannière + avatar */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Photos
                        </label>

                        {/* Bannière */}
                        <div className="relative">
                            <div
                                className={`h-28 rounded-xl overflow-hidden ${bannerUrl ? '' : `bg-gradient-to-br ${formData.banner_color || 'from-blue-600 via-indigo-600 to-purple-700'}`}`}
                                style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                            >
                                <div className="absolute inset-0 bg-black/15" />
                            </div>

                            {/* Actions bannière */}
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => bannerInputRef.current?.click()}
                                    disabled={uploadBanner.isPending}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg text-xs font-medium backdrop-blur-sm transition-colors disabled:opacity-60"
                                >
                                    {uploadBanner.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                                    {bannerUrl ? 'Changer' : 'Ajouter une bannière'}
                                </button>
                                {bannerUrl && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveBanner}
                                        disabled={deleteImage.isPending}
                                        className="p-1.5 bg-black/50 hover:bg-red-600/80 text-white rounded-lg backdrop-blur-sm transition-colors"
                                        title="Supprimer la bannière"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Avatar (chevauche la bannière) */}
                            <div className="absolute -bottom-8 left-4">
                                <div className="relative">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Avatar"
                                            className="w-20 h-20 rounded-2xl border-4 border-white object-cover shadow-lg"
                                        />
                                    ) : (
                                        <div className={`w-20 h-20 rounded-2xl border-4 border-white bg-gradient-to-br ${formData.avatar_color || 'from-blue-500 to-purple-600'} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                                            {`${profile?.name?.[0] || ''}${profile?.lastname?.[0] || ''}`}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={uploadAvatar.isPending}
                                        className="absolute -bottom-1 -right-1 p-1.5 bg-gray-900 hover:bg-gray-700 text-white rounded-lg shadow-md transition-colors disabled:opacity-60"
                                        title="Changer la photo de profil"
                                    >
                                        {uploadAvatar.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                JPG, PNG, GIF ou WebP. Avatar ≤ 5 Mo, bannière ≤ 10 Mo.
                            </p>
                            {avatarUrl && (
                                <button
                                    type="button"
                                    onClick={handleRemoveAvatar}
                                    disabled={deleteImage.isPending}
                                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                                >
                                    Supprimer la photo de profil
                                </button>
                            )}
                        </div>

                        {/* Inputs fichiers cachés */}
                        <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarFile} />
                        <input ref={bannerInputRef} type="file" accept="image/*" hidden onChange={handleBannerFile} />
                    </div>

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

                    {/* Avatar Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Couleur de l'avatar <span className="font-normal text-gray-400">(si aucune photo)</span>
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { value: 'from-blue-500 to-purple-600', label: 'Bleu-Violet' },
                                { value: 'from-green-500 to-teal-600', label: 'Vert' },
                                { value: 'from-orange-500 to-red-600', label: 'Orange' },
                                { value: 'from-pink-500 to-purple-600', label: 'Rose' },
                                { value: 'from-yellow-500 to-orange-600', label: 'Jaune' },
                                { value: 'from-indigo-500 to-blue-600', label: 'Indigo' },
                                { value: 'from-red-500 to-pink-600', label: 'Rouge' },
                                { value: 'from-teal-500 to-green-600', label: 'Turquoise' },
                            ].map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, avatar_color: color.value })}
                                    className={`h-12 rounded-lg bg-gradient-to-br ${color.value} border-2 transition-all ${formData.avatar_color === color.value
                                            ? 'border-gray-900 ring-2 ring-gray-900'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    title={color.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Banner Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Couleur de la bannière <span className="font-normal text-gray-400">(si aucune photo)</span>
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { value: 'from-blue-600 via-indigo-600 to-purple-700', label: 'Bleu-Violet' },
                                { value: 'from-green-600 via-teal-600 to-cyan-700', label: 'Vert-Cyan' },
                                { value: 'from-orange-600 via-red-600 to-pink-700', label: 'Orange-Rose' },
                                { value: 'from-purple-600 via-pink-600 to-red-700', label: 'Violet-Rouge' },
                                { value: 'from-yellow-600 via-orange-600 to-red-700', label: 'Jaune-Rouge' },
                                { value: 'from-indigo-600 via-blue-600 to-cyan-700', label: 'Indigo-Cyan' },
                                { value: 'from-gray-600 via-gray-700 to-gray-800', label: 'Gris' },
                                { value: 'from-emerald-600 via-green-600 to-teal-700', label: 'Émeraude' },
                            ].map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, banner_color: color.value })}
                                    className={`h-12 rounded-lg bg-gradient-to-br ${color.value} border-2 transition-all ${formData.banner_color === color.value
                                            ? 'border-gray-900 ring-2 ring-gray-900'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    title={color.label}
                                />
                            ))}
                        </div>
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
