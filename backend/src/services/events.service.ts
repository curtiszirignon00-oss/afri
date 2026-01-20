// src/services/events.service.ts
import { PrismaClient, EventStatus, EventType } from '@prisma/client';

const prisma = new PrismaClient();

// Email admin autorisé à gérer les événements
const ADMIN_EMAIL = 'contact@africbourse.com';

export interface CreateEventDTO {
    title: string;
    description: string;
    type?: EventType;
    event_date: Date;
    end_date?: Date;
    timezone?: string;
    is_online?: boolean;
    platform?: string;
    meeting_url?: string;
    meeting_id?: string;
    meeting_password?: string;
    physical_location?: string;
    registration_required?: boolean;
    registration_deadline?: Date;
    max_participants?: number;
    image_url?: string;
    is_free?: boolean;
    price?: number;
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> {
    status?: EventStatus;
    replay_url?: string;
    documents?: string[];
}

class EventsService {
    /**
     * Vérifie si l'utilisateur est l'admin autorisé
     */
    async isAuthorizedAdmin(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, role: true }
        });

        if (!user) return false;

        // L'admin contact@africbourse.com, ou tout admin/superadmin
        const isAdminEmail = user.email === ADMIN_EMAIL;
        const isAdminRole = user.role === 'admin' || user.role === 'superadmin';

        console.log(`[EventsService] Checking admin access for ${user.email}, role: ${user.role}, isAdmin: ${isAdminEmail || isAdminRole}`);

        return isAdminEmail || isAdminRole;
    }

    /**
     * Créer un nouvel événement
     */
    async createEvent(userId: string, data: CreateEventDTO) {
        const isAuthorized = await this.isAuthorizedAdmin(userId);
        if (!isAuthorized) {
            throw new Error('Non autorisé à créer des événements');
        }

        const event = await prisma.event.create({
            data: {
                title: data.title,
                description: data.description,
                type: data.type || 'WEBINAR',
                status: 'DRAFT',
                event_date: new Date(data.event_date),
                end_date: data.end_date ? new Date(data.end_date) : null,
                timezone: data.timezone || 'GMT',
                is_online: data.is_online ?? true,
                platform: data.platform,
                meeting_url: data.meeting_url,
                meeting_id: data.meeting_id,
                meeting_password: data.meeting_password,
                physical_location: data.physical_location,
                registration_required: data.registration_required ?? true,
                registration_deadline: data.registration_deadline ? new Date(data.registration_deadline) : null,
                max_participants: data.max_participants,
                image_url: data.image_url,
                is_free: data.is_free ?? true,
                price: data.price,
                created_by: userId
            },
            include: {
                creator: {
                    select: { id: true, name: true, lastname: true, email: true }
                },
                _count: {
                    select: { registrations: true }
                }
            }
        });

        return event;
    }

    /**
     * Mettre à jour un événement
     */
    async updateEvent(userId: string, eventId: string, data: UpdateEventDTO) {
        const isAuthorized = await this.isAuthorizedAdmin(userId);
        if (!isAuthorized) {
            throw new Error('Non autorisé à modifier des événements');
        }

        const event = await prisma.event.update({
            where: { id: eventId },
            data: {
                ...data,
                event_date: data.event_date ? new Date(data.event_date) : undefined,
                end_date: data.end_date ? new Date(data.end_date) : undefined,
                registration_deadline: data.registration_deadline ? new Date(data.registration_deadline) : undefined,
                updated_at: new Date()
            },
            include: {
                creator: {
                    select: { id: true, name: true, lastname: true, email: true }
                },
                _count: {
                    select: { registrations: true }
                }
            }
        });

        return event;
    }

    /**
     * Supprimer un événement
     */
    async deleteEvent(userId: string, eventId: string) {
        const isAuthorized = await this.isAuthorizedAdmin(userId);
        if (!isAuthorized) {
            throw new Error('Non autorisé à supprimer des événements');
        }

        await prisma.event.delete({
            where: { id: eventId }
        });

        return { success: true };
    }

    /**
     * Publier un événement (le rendre visible)
     */
    async publishEvent(userId: string, eventId: string) {
        return this.updateEvent(userId, eventId, { status: 'PUBLISHED' });
    }

    /**
     * Annuler un événement
     */
    async cancelEvent(userId: string, eventId: string) {
        return this.updateEvent(userId, eventId, { status: 'CANCELLED' });
    }

    /**
     * Marquer un événement comme terminé
     */
    async completeEvent(userId: string, eventId: string, replayUrl?: string) {
        return this.updateEvent(userId, eventId, {
            status: 'COMPLETED',
            replay_url: replayUrl
        });
    }

    /**
     * Récupérer tous les événements (pour l'admin)
     */
    async getAllEvents(userId: string) {
        const isAuthorized = await this.isAuthorizedAdmin(userId);
        if (!isAuthorized) {
            throw new Error('Non autorisé');
        }

        const events = await prisma.event.findMany({
            orderBy: { event_date: 'desc' },
            include: {
                creator: {
                    select: { id: true, name: true, lastname: true, email: true }
                },
                _count: {
                    select: { registrations: true }
                }
            }
        });

        return events;
    }

    /**
     * Récupérer les événements publiés (pour le public)
     */
    async getPublishedEvents() {
        const events = await prisma.event.findMany({
            where: {
                status: { in: ['PUBLISHED', 'COMPLETED'] }
            },
            orderBy: { event_date: 'desc' },
            include: {
                creator: {
                    select: { id: true, name: true, lastname: true }
                },
                _count: {
                    select: { registrations: true }
                }
            }
        });

        return events;
    }

    /**
     * Récupérer les événements à venir
     */
    async getUpcomingEvents() {
        const now = new Date();

        const events = await prisma.event.findMany({
            where: {
                status: 'PUBLISHED',
                event_date: { gte: now }
            },
            orderBy: { event_date: 'asc' },
            include: {
                creator: {
                    select: { id: true, name: true, lastname: true }
                },
                _count: {
                    select: { registrations: true }
                }
            }
        });

        return events;
    }

    /**
     * Récupérer les événements passés (avec replay)
     */
    async getPastEvents() {
        const now = new Date();

        const events = await prisma.event.findMany({
            where: {
                status: { in: ['PUBLISHED', 'COMPLETED'] },
                event_date: { lt: now }
            },
            orderBy: { event_date: 'desc' },
            include: {
                creator: {
                    select: { id: true, name: true, lastname: true }
                },
                _count: {
                    select: { registrations: true }
                }
            }
        });

        return events;
    }

    /**
     * Récupérer un événement par ID
     */
    async getEventById(eventId: string, userId?: string) {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                creator: {
                    select: { id: true, name: true, lastname: true }
                },
                _count: {
                    select: { registrations: true }
                }
            }
        });

        if (!event) {
            throw new Error('Événement non trouvé');
        }

        // Vérifier si l'utilisateur est inscrit
        let isRegistered = false;
        let registration = null;

        if (userId) {
            registration = await prisma.eventRegistration.findUnique({
                where: {
                    event_id_user_id: {
                        event_id: eventId,
                        user_id: userId
                    }
                }
            });
            isRegistered = !!registration && !registration.cancelled;
        }

        // Ne montrer le lien de réunion qu'aux inscrits
        const canSeeMeetingDetails = isRegistered || (userId && await this.isAuthorizedAdmin(userId));

        return {
            ...event,
            meeting_url: canSeeMeetingDetails ? event.meeting_url : null,
            meeting_id: canSeeMeetingDetails ? event.meeting_id : null,
            meeting_password: canSeeMeetingDetails ? event.meeting_password : null,
            isRegistered,
            registration
        };
    }

    /**
     * S'inscrire à un événement
     */
    async registerToEvent(userId: string, eventId: string) {
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                _count: {
                    select: { registrations: true }
                }
            }
        });

        if (!event) {
            throw new Error('Événement non trouvé');
        }

        if (event.status !== 'PUBLISHED') {
            throw new Error('Cet événement n\'est pas ouvert aux inscriptions');
        }

        // Vérifier la date limite d'inscription
        if (event.registration_deadline && new Date() > event.registration_deadline) {
            throw new Error('La date limite d\'inscription est dépassée');
        }

        // Vérifier le nombre max de participants
        if (event.max_participants && event._count.registrations >= event.max_participants) {
            throw new Error('Le nombre maximum de participants est atteint');
        }

        // Vérifier si déjà inscrit
        const existingRegistration = await prisma.eventRegistration.findUnique({
            where: {
                event_id_user_id: {
                    event_id: eventId,
                    user_id: userId
                }
            }
        });

        if (existingRegistration) {
            if (existingRegistration.cancelled) {
                // Réactiver l'inscription
                const registration = await prisma.eventRegistration.update({
                    where: { id: existingRegistration.id },
                    data: {
                        cancelled: false,
                        cancelled_at: null
                    }
                });
                return { registration, reactivated: true };
            }
            throw new Error('Vous êtes déjà inscrit à cet événement');
        }

        const registration = await prisma.eventRegistration.create({
            data: {
                event_id: eventId,
                user_id: userId
            },
            include: {
                event: {
                    select: {
                        title: true,
                        event_date: true,
                        platform: true,
                        meeting_url: true,
                        meeting_id: true,
                        meeting_password: true
                    }
                }
            }
        });

        return { registration, reactivated: false };
    }

    /**
     * Annuler son inscription
     */
    async cancelRegistration(userId: string, eventId: string) {
        const registration = await prisma.eventRegistration.findUnique({
            where: {
                event_id_user_id: {
                    event_id: eventId,
                    user_id: userId
                }
            }
        });

        if (!registration) {
            throw new Error('Vous n\'êtes pas inscrit à cet événement');
        }

        await prisma.eventRegistration.update({
            where: { id: registration.id },
            data: {
                cancelled: true,
                cancelled_at: new Date()
            }
        });

        return { success: true };
    }

    /**
     * Récupérer les inscriptions d'un utilisateur
     */
    async getUserRegistrations(userId: string) {
        const registrations = await prisma.eventRegistration.findMany({
            where: {
                user_id: userId,
                cancelled: false
            },
            include: {
                event: {
                    include: {
                        _count: {
                            select: { registrations: true }
                        }
                    }
                }
            },
            orderBy: {
                event: {
                    event_date: 'asc'
                }
            }
        });

        return registrations;
    }

    /**
     * Récupérer les participants d'un événement (admin)
     */
    async getEventParticipants(userId: string, eventId: string) {
        const isAuthorized = await this.isAuthorizedAdmin(userId);
        if (!isAuthorized) {
            throw new Error('Non autorisé');
        }

        const registrations = await prisma.eventRegistration.findMany({
            where: {
                event_id: eventId,
                cancelled: false
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
                        telephone: true
                    }
                }
            },
            orderBy: { registered_at: 'asc' }
        });

        return registrations;
    }

    /**
     * Marquer la présence d'un participant (admin)
     */
    async markAttendance(userId: string, registrationId: string, attended: boolean) {
        const isAuthorized = await this.isAuthorizedAdmin(userId);
        if (!isAuthorized) {
            throw new Error('Non autorisé');
        }

        const registration = await prisma.eventRegistration.update({
            where: { id: registrationId },
            data: { attended }
        });

        return registration;
    }

    /**
     * Vérifier si un utilisateur est inscrit à un événement
     */
    async isUserRegistered(userId: string, eventId: string): Promise<boolean> {
        const registration = await prisma.eventRegistration.findUnique({
            where: {
                event_id_user_id: {
                    event_id: eventId,
                    user_id: userId
                }
            }
        });

        return !!registration && !registration.cancelled;
    }
}

export const eventsService = new EventsService();
