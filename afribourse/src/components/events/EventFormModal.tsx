// src/components/events/EventFormModal.tsx
import { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    Clock,
    Video,
    MapPin,
    Users,
    Link as LinkIcon,
    Save,
    Loader2,
    Globe,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    useCreateEvent,
    useUpdateEvent,
    type Event,
    type CreateEventDTO,
} from '../../hooks/useEvents';

interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    event?: Event | null; // Si fourni, mode édition
}

const EVENT_TYPES = [
    { value: 'WEBINAR', label: 'Webinaire' },
    { value: 'WORKSHOP', label: 'Atelier pratique' },
    { value: 'CONFERENCE', label: 'Conference' },
    { value: 'MEETUP', label: 'Rencontre' },
    { value: 'OTHER', label: 'Autre' },
];

const PLATFORMS = [
    { value: 'zoom', label: 'Zoom' },
    { value: 'google_meet', label: 'Google Meet' },
    { value: 'teams', label: 'Microsoft Teams' },
    { value: 'other', label: 'Autre' },
];

export default function EventFormModal({ isOpen, onClose, event }: EventFormModalProps) {
    const createEvent = useCreateEvent();
    const updateEvent = useUpdateEvent();

    const isEditing = !!event;

    // Form state
    const [formData, setFormData] = useState<CreateEventDTO>({
        title: '',
        description: '',
        type: 'WEBINAR',
        event_date: '',
        end_date: '',
        timezone: 'GMT',
        is_online: true,
        platform: 'zoom',
        meeting_url: '',
        meeting_id: '',
        meeting_password: '',
        physical_location: '',
        registration_required: true,
        registration_deadline: '',
        max_participants: undefined,
        image_url: '',
        is_free: true,
        price: undefined,
    });

    // Populate form when editing
    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title,
                description: event.description,
                type: event.type,
                event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
                end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
                timezone: event.timezone || 'GMT',
                is_online: event.is_online,
                platform: event.platform || 'zoom',
                meeting_url: event.meeting_url || '',
                meeting_id: event.meeting_id || '',
                meeting_password: event.meeting_password || '',
                physical_location: event.physical_location || '',
                registration_required: event.registration_required,
                registration_deadline: event.registration_deadline
                    ? new Date(event.registration_deadline).toISOString().slice(0, 16)
                    : '',
                max_participants: event.max_participants || undefined,
                image_url: event.image_url || '',
                is_free: event.is_free,
                price: event.price || undefined,
            });
        } else {
            // Reset form for new event
            setFormData({
                title: '',
                description: '',
                type: 'WEBINAR',
                event_date: '',
                end_date: '',
                timezone: 'GMT',
                is_online: true,
                platform: 'zoom',
                meeting_url: '',
                meeting_id: '',
                meeting_password: '',
                physical_location: '',
                registration_required: true,
                registration_deadline: '',
                max_participants: undefined,
                image_url: '',
                is_free: true,
                price: undefined,
            });
        }
    }, [event]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.description || !formData.event_date) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            if (isEditing && event) {
                await updateEvent.mutateAsync({
                    eventId: event.id,
                    data: formData,
                });
                toast.success('Evenement mis a jour');
            } else {
                await createEvent.mutateAsync(formData);
                toast.success('Evenement cree (brouillon)');
            }
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde');
        }
    };

    if (!isOpen) return null;

    const isLoading = createEvent.isPending || updateEvent.isPending;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/50 transition-opacity"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
                        <h2 className="text-xl font-bold text-gray-900">
                            {isEditing ? 'Modifier l\'evenement' : 'Creer un evenement'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Informations de base */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                Informations de base
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Titre *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Ex: Webinaire - Strategies de trading sur la BRVM"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Decrivez l'evenement..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type d'evenement
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {EVENT_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        URL de l'image (optionnel)
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.image_url}
                                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Date et heure */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-600" />
                                Date et heure
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date et heure de debut *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.event_date}
                                        onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date et heure de fin
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fuseau horaire
                                </label>
                                <select
                                    value={formData.timezone}
                                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="GMT">GMT (Abidjan, Dakar)</option>
                                    <option value="GMT+1">GMT+1 (Lagos, Douala)</option>
                                    <option value="CET">CET (Paris)</option>
                                </select>
                            </div>
                        </div>

                        {/* Lieu / Plateforme */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-indigo-600" />
                                Lieu / Plateforme
                            </h3>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={formData.is_online}
                                        onChange={() => setFormData({ ...formData, is_online: true })}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    <Video className="w-4 h-4" />
                                    En ligne
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={!formData.is_online}
                                        onChange={() => setFormData({ ...formData, is_online: false })}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    <MapPin className="w-4 h-4" />
                                    En presentiel
                                </label>
                            </div>

                            {formData.is_online ? (
                                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Plateforme
                                        </label>
                                        <select
                                            value={formData.platform}
                                            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            {PLATFORMS.map((p) => (
                                                <option key={p.value} value={p.value}>
                                                    {p.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Lien de la reunion (Zoom/Meet)
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.meeting_url}
                                            onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="https://zoom.us/j/... ou https://meet.google.com/..."
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Ce lien sera visible uniquement par les inscrits
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ID de reunion (optionnel)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.meeting_id}
                                                onChange={(e) => setFormData({ ...formData, meeting_id: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="123 456 789"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Mot de passe (optionnel)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.meeting_password}
                                                onChange={(e) => setFormData({ ...formData, meeting_password: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="abc123"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Adresse du lieu
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.physical_location}
                                        onChange={(e) => setFormData({ ...formData, physical_location: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Ex: Hotel Ivoire, Abidjan, Cote d'Ivoire"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Inscriptions */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-600" />
                                Inscriptions
                            </h3>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.registration_required}
                                    onChange={(e) => setFormData({ ...formData, registration_required: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                Inscription obligatoire
                            </label>

                            {formData.registration_required && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date limite d'inscription
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formData.registration_deadline}
                                            onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre max de participants
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.max_participants || ''}
                                            onChange={(e) => setFormData({ ...formData, max_participants: e.target.value ? parseInt(e.target.value) : undefined })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Illimite"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={formData.is_free}
                                        onChange={() => setFormData({ ...formData, is_free: true, price: undefined })}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    Gratuit
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={!formData.is_free}
                                        onChange={() => setFormData({ ...formData, is_free: false })}
                                        className="w-4 h-4 text-indigo-600"
                                    />
                                    Payant
                                </label>
                            </div>

                            {!formData.is_free && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prix (FCFA)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.price || ''}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="5000"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {isEditing ? 'Mettre a jour' : 'Creer (brouillon)'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
