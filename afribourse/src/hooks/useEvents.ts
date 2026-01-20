// src/hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

// Types
export interface Event {
    id: string;
    title: string;
    description: string;
    type: 'WEBINAR' | 'WORKSHOP' | 'CONFERENCE' | 'MEETUP' | 'OTHER';
    status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
    event_date: string;
    end_date?: string;
    timezone: string;
    is_online: boolean;
    platform?: string;
    meeting_url?: string;
    meeting_id?: string;
    meeting_password?: string;
    physical_location?: string;
    registration_required: boolean;
    registration_deadline?: string;
    max_participants?: number;
    image_url?: string;
    replay_url?: string;
    documents: string[];
    is_free: boolean;
    price?: number;
    created_by: string;
    created_at: string;
    updated_at: string;
    creator?: {
        id: string;
        name: string;
        lastname: string;
    };
    _count?: {
        registrations: number;
    };
    isRegistered?: boolean;
    registration?: {
        id: string;
        attended: boolean;
        registered_at: string;
    };
}

export interface EventRegistration {
    id: string;
    event_id: string;
    user_id: string;
    attended: boolean;
    cancelled: boolean;
    registered_at: string;
    event?: Event;
    user?: {
        id: string;
        name: string;
        lastname: string;
        email: string;
        telephone?: string;
    };
}

export interface CreateEventDTO {
    title: string;
    description: string;
    type?: Event['type'];
    event_date: string;
    end_date?: string;
    timezone?: string;
    is_online?: boolean;
    platform?: string;
    meeting_url?: string;
    meeting_id?: string;
    meeting_password?: string;
    physical_location?: string;
    registration_required?: boolean;
    registration_deadline?: string;
    max_participants?: number;
    image_url?: string;
    is_free?: boolean;
    price?: number;
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> {
    status?: Event['status'];
    replay_url?: string;
    documents?: string[];
}

// =============================================
// QUERIES - Lecture des données
// =============================================

/**
 * Récupérer les événements publiés
 */
export function usePublishedEvents() {
    return useQuery({
        queryKey: ['events', 'published'],
        queryFn: async () => {
            const { data } = await api.get<Event[]>('/events/published');
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Récupérer les événements à venir
 */
export function useUpcomingEvents() {
    return useQuery({
        queryKey: ['events', 'upcoming'],
        queryFn: async () => {
            const { data } = await api.get<Event[]>('/events/upcoming');
            return data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Récupérer les événements passés
 */
export function usePastEvents() {
    return useQuery({
        queryKey: ['events', 'past'],
        queryFn: async () => {
            const { data } = await api.get<Event[]>('/events/past');
            return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Récupérer un événement par ID
 */
export function useEvent(eventId: string) {
    return useQuery({
        queryKey: ['events', eventId],
        queryFn: async () => {
            const { data } = await api.get<Event>(`/events/${eventId}`);
            return data;
        },
        enabled: !!eventId,
    });
}

/**
 * Récupérer mes inscriptions
 */
export function useMyEventRegistrations() {
    return useQuery({
        queryKey: ['events', 'my-registrations'],
        queryFn: async () => {
            const { data } = await api.get<EventRegistration[]>('/events/my/registrations');
            return data;
        },
    });
}

/**
 * Vérifier si l'utilisateur est admin des événements
 */
export function useIsEventsAdmin() {
    return useQuery({
        queryKey: ['events', 'admin-check'],
        queryFn: async () => {
            try {
                const { data } = await api.get<{ isAdmin: boolean }>('/events/admin/check');
                return data.isAdmin;
            } catch (error) {
                return false;
            }
        },
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Récupérer tous les événements (admin)
 */
export function useAllEvents() {
    return useQuery({
        queryKey: ['events', 'all'],
        queryFn: async () => {
            const { data } = await api.get<Event[]>('/events/admin/all');
            return data;
        },
    });
}

/**
 * Récupérer les participants d'un événement (admin)
 */
export function useEventParticipants(eventId: string) {
    return useQuery({
        queryKey: ['events', eventId, 'participants'],
        queryFn: async () => {
            const { data } = await api.get<EventRegistration[]>(`/events/admin/${eventId}/participants`);
            return data;
        },
        enabled: !!eventId,
    });
}

// =============================================
// MUTATIONS - Modification des données
// =============================================

/**
 * S'inscrire à un événement
 */
export function useRegisterToEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (eventId: string) => {
            const { data } = await api.post(`/events/${eventId}/register`);
            return data;
        },
        onSuccess: (_, eventId) => {
            queryClient.invalidateQueries({ queryKey: ['events', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events', 'my-registrations'] });
            queryClient.invalidateQueries({ queryKey: ['events', 'upcoming'] });
            queryClient.invalidateQueries({ queryKey: ['events', 'published'] });
        },
    });
}

/**
 * Annuler son inscription
 */
export function useCancelRegistration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (eventId: string) => {
            const { data } = await api.delete(`/events/${eventId}/register`);
            return data;
        },
        onSuccess: (_, eventId) => {
            queryClient.invalidateQueries({ queryKey: ['events', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events', 'my-registrations'] });
            queryClient.invalidateQueries({ queryKey: ['events', 'upcoming'] });
            queryClient.invalidateQueries({ queryKey: ['events', 'published'] });
        },
    });
}

/**
 * Créer un événement (admin)
 */
export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (eventData: CreateEventDTO) => {
            const { data } = await api.post<Event>('/events/admin/create', eventData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}

/**
 * Mettre à jour un événement (admin)
 */
export function useUpdateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ eventId, data: eventData }: { eventId: string; data: UpdateEventDTO }) => {
            const { data } = await api.put<Event>(`/events/admin/${eventId}`, eventData);
            return data;
        },
        onSuccess: (_, { eventId }) => {
            queryClient.invalidateQueries({ queryKey: ['events', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}

/**
 * Supprimer un événement (admin)
 */
export function useDeleteEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (eventId: string) => {
            const { data } = await api.delete(`/events/admin/${eventId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}

/**
 * Publier un événement (admin)
 */
export function usePublishEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (eventId: string) => {
            const { data } = await api.post<Event>(`/events/admin/${eventId}/publish`);
            return data;
        },
        onSuccess: (_, eventId) => {
            queryClient.invalidateQueries({ queryKey: ['events', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}

/**
 * Annuler un événement (admin)
 */
export function useCancelEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (eventId: string) => {
            const { data } = await api.post<Event>(`/events/admin/${eventId}/cancel`);
            return data;
        },
        onSuccess: (_, eventId) => {
            queryClient.invalidateQueries({ queryKey: ['events', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}

/**
 * Marquer un événement comme terminé (admin)
 */
export function useCompleteEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ eventId, replay_url }: { eventId: string; replay_url?: string }) => {
            const { data } = await api.post<Event>(`/events/admin/${eventId}/complete`, { replay_url });
            return data;
        },
        onSuccess: (_, { eventId }) => {
            queryClient.invalidateQueries({ queryKey: ['events', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}

/**
 * Marquer la présence d'un participant (admin)
 */
export function useMarkAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ registrationId, attended }: { registrationId: string; attended: boolean }) => {
            const { data } = await api.patch(`/events/admin/attendance/${registrationId}`, { attended });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
    });
}

// =============================================
// HELPERS
// =============================================

/**
 * Formater le type d'événement
 */
export function formatEventType(type: Event['type']): string {
    const types: Record<Event['type'], string> = {
        WEBINAR: 'Webinaire',
        WORKSHOP: 'Atelier',
        CONFERENCE: 'Conference',
        MEETUP: 'Rencontre',
        OTHER: 'Autre',
    };
    return types[type] || type;
}

/**
 * Formater le statut d'événement
 */
export function formatEventStatus(status: Event['status']): string {
    const statuses: Record<Event['status'], string> = {
        DRAFT: 'Brouillon',
        PUBLISHED: 'Publie',
        CANCELLED: 'Annule',
        COMPLETED: 'Termine',
    };
    return statuses[status] || status;
}

/**
 * Vérifier si un événement est passé
 */
export function isEventPast(event: Event): boolean {
    return new Date(event.event_date) < new Date();
}

/**
 * Vérifier si les inscriptions sont encore ouvertes
 */
export function isRegistrationOpen(event: Event): boolean {
    if (event.status !== 'PUBLISHED') return false;
    if (isEventPast(event)) return false;
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) return false;
    if (event.max_participants && event._count && event._count.registrations >= event.max_participants) return false;
    return true;
}
