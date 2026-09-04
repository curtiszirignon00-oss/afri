// src/components/profile/EditProfileModal.tsx
import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Linkedin, Twitter, Instagram, Facebook, Camera, Trash2, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    useUpdateProfile,
    useUploadAvatar,
    useUploadBanner,
    useDeleteImage,
    validateImageFile,
    type ProfileUpdateData,
} from '../../hooks/useUpload';
import { HERO_BACKGROUNDS, HERO_GRID_STYLE } from '../../utils/heroBackgrounds';

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
    const [specialtyTags, setSpecialtyTags] = useState<string[]>([]);

    const isFounder = profile?.role === 'admin';

    // Suggestions de bio orientées identité (chantier 4.2)
    const bioSuggestions = isFounder
        ? [
            "Fondateur d'Afribourse. Mission : rendre l'investissement boursier plus accessible, plus pédagogique et plus communautaire en Afrique de l'Ouest.",
        ]
        : [
            "J'apprends à investir progressivement sur la BRVM.",
            "Je m'intéresse aux actions à dividendes et à l'analyse fondamentale.",
            "Je construis mon premier portefeuille virtuel sur Afribourse.",
        ];

    // Tags de spécialité proposés (chantier 4.3)
    const SPECIALTY_OPTIONS = ['BRVM', 'Dividendes', 'Banques', 'Obligations', 'Analyse fondamentale', 'Débutant', 'Croissance', 'Gestion du risque'];

    const toggleTag = (tag: string) => {
        setSpecialtyTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length >= 8 ? prev : [...prev, tag]
        );
    };

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
                avatar_color: profile.profile?.avatar_color || 'from-brand-orange to-brand-orange-dark',
                banner_color: profile.profile?.banner_color || '',
                linkedin: profile.profile?.social_links?.linkedin || '',
                twitter: profile.profile?.social_links?.twitter || '',
                website: profile.profile?.social_links?.website || '',
                instagram: profile.profile?.social_links?.instagram || '',
                facebook: profile.profile?.social_links?.facebook || '',
            });
            setAvatarUrl(profile.profile?.avatar_url || null);
            setBannerUrl(profile.profile?.banner_url || null);
            setSpecialtyTags(Array.isArray(profile.profile?.specialty_tags) ? profile.profile.specialty_tags : []);
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
        // Toujours envoyer les tags (permet de tout retirer)
        updateData.specialty_tags = specialtyTags;

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
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-xl font-semibold text-ink-900">
                        Modifier le profil
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-ink-400 hover:text-ink-600 hover:bg-ink-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Photos : bannière + avatar */}
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-2">
                            Photos
                        </label>

                        {/* Bannière */}
                        <div className="relative">
                            <div
                                className="h-28 rounded-xl overflow-hidden relative"
                                style={bannerUrl
                                    ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                                    : { backgroundImage: HERO_BACKGROUNDS[0].gradient }}
                            >
                                {!bannerUrl && (
                                    <>
                                        <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: HERO_BACKGROUNDS[0].halo }} />
                                        <div aria-hidden="true" className="absolute inset-0 opacity-[0.07]" style={HERO_GRID_STYLE} />
                                    </>
                                )}
                                <div className="absolute inset-0 bg-ink-950/15" />
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
                                        <div className={`w-20 h-20 rounded-2xl border-4 border-white bg-gradient-to-br ${formData.avatar_color || 'from-brand-orange to-brand-orange-dark'} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                                            {`${profile?.name?.[0] || ''}${profile?.lastname?.[0] || ''}`}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={uploadAvatar.isPending}
                                        className="absolute -bottom-1 -right-1 p-1.5 bg-brand-navy hover:bg-brand-navy-hover text-white rounded-lg shadow-md transition-colors disabled:opacity-60 cursor-pointer"
                                        title="Changer la photo de profil"
                                    >
                                        {uploadAvatar.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex items-center justify-between">
                            <p className="text-xs text-ink-500">
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
                        <label className="block text-sm font-medium text-ink-700 mb-1">
                            Prénom
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Votre prénom"
                            className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                            maxLength={50}
                        />
                    </div>

                    {/* Lastname */}
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">
                            Nom de famille
                        </label>
                        <input
                            type="text"
                            value={formData.lastname}
                            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                            placeholder="Votre nom de famille"
                            className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                            maxLength={50}
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">
                            Nom d'utilisateur
                        </label>
                        <div className="flex items-center">
                            <span className="text-ink-500 mr-1">@</span>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                placeholder="votre_nom"
                                className="flex-1 px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                                maxLength={30}
                            />
                        </div>
                        <p className="text-xs text-ink-500 mt-1">
                            Lettres, chiffres et underscores uniquement
                        </p>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">
                            Bio
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Parlez-nous de vous..."
                            rows={3}
                            className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent resize-none"
                            maxLength={200}
                        />
                        <p className="text-xs text-ink-500 mt-1 text-right">
                            {formData.bio.length}/200
                        </p>
                        {/* Suggestions de bio cliquables */}
                        <div className="mt-2">
                            <p className="text-xs text-ink-400 mb-1.5">Suggestions :</p>
                            <div className="flex flex-wrap gap-2">
                                {bioSuggestions.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, bio: s.slice(0, 200) })}
                                        className="text-left text-xs px-2.5 py-1.5 bg-ink-50 border border-ink-100 text-brand-navy rounded-lg hover:bg-ink-100 transition-colors max-w-full cursor-pointer"
                                    >
                                        {s.length > 70 ? s.slice(0, 70) + '…' : s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tags de spécialité */}
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-2">
                            Tags de spécialité <span className="font-normal text-ink-400">({specialtyTags.length}/8)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SPECIALTY_OPTIONS.map((tag) => {
                                const active = specialtyTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleTag(tag)}
                                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${active
                                            ? 'bg-brand-navy text-white border-brand-navy'
                                            : 'bg-white text-ink-700 border-ink-200 hover:border-brand-navy hover:text-brand-navy'}`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Country */}
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">
                            Pays
                        </label>
                        <select
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent"
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
                        <label className="block text-sm font-medium text-ink-700 mb-2">
                            Couleur de l'avatar <span className="font-normal text-ink-400">(si aucune photo)</span>
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { value: 'from-brand-orange to-brand-orange-dark', label: 'Orange' },
                                { value: 'from-brand-navy to-brand-navy-hover', label: 'Navy' },
                                { value: 'from-brand-orange-light to-brand-orange', label: 'Ambre' },
                                { value: 'from-brand-navy to-brand-orange', label: 'Navy-Orange' },
                                { value: 'from-ink-700 to-ink-900', label: 'Encre' },
                                { value: 'from-ink-500 to-brand-navy', label: 'Ardoise' },
                                { value: 'from-brand-orange to-brand-navy', label: 'Coucher' },
                                { value: 'from-ink-400 to-ink-600', label: 'Gris' },
                            ].map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, avatar_color: color.value })}
                                    className={`h-12 rounded-lg bg-gradient-to-br ${color.value} border-2 transition-all ${formData.avatar_color === color.value
                                            ? 'border-brand-navy ring-2 ring-brand-navy'
                                            : 'border-ink-100 hover:border-ink-300'
                                        }`}
                                    title={color.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Social Links */}
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-3">
                            Réseaux sociaux
                        </label>
                        <div className="space-y-3">
                            {/* LinkedIn */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-ink-100 rounded-lg flex items-center justify-center">
                                    <Linkedin className="w-5 h-5 text-brand-navy" />
                                </div>
                                <input
                                    type="url"
                                    value={formData.linkedin}
                                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                    placeholder="https://linkedin.com/in/..."
                                    className="flex-1 px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                                />
                            </div>

                            {/* Twitter/X */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-ink-100 rounded-lg flex items-center justify-center">
                                    <Twitter className="w-5 h-5 text-brand-navy" />
                                </div>
                                <input
                                    type="url"
                                    value={formData.twitter}
                                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                    placeholder="https://twitter.com/..."
                                    className="flex-1 px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                                />
                            </div>

                            {/* Instagram */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-ink-100 rounded-lg flex items-center justify-center">
                                    <Instagram className="w-5 h-5 text-brand-navy" />
                                </div>
                                <input
                                    type="url"
                                    value={formData.instagram}
                                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                    placeholder="https://instagram.com/..."
                                    className="flex-1 px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                                />
                            </div>

                            {/* Facebook */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-ink-100 rounded-lg flex items-center justify-center">
                                    <Facebook className="w-5 h-5 text-brand-navy" />
                                </div>
                                <input
                                    type="url"
                                    value={formData.facebook}
                                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                    placeholder="https://facebook.com/..."
                                    className="flex-1 px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                                />
                            </div>

                            {/* Website */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://votre-site.com"
                                    className="flex-1 px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-ink-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-ink-700 bg-ink-100 hover:bg-ink-200 rounded-xl font-semibold transition-colors cursor-pointer"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 px-4 py-2.5 bg-brand-orange text-white rounded-xl hover:bg-brand-orange-hover disabled:opacity-50 font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
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
