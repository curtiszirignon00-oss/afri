// src/controllers/events.controller.ts
import { Request, Response } from 'express';
import { eventsService } from '../services/events.service';

interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const eventsController = {
    /**
     * Créer un nouvel événement (admin)
     */
    async createEvent(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            const event = await eventsService.createEvent(userId, req.body);
            res.status(201).json(event);
        } catch (error: any) {
            console.error('Erreur création événement:', error);
            res.status(error.message === 'Non autorisé à créer des événements' ? 403 : 500)
                .json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Mettre à jour un événement (admin)
     */
    async updateEvent(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { eventId } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            const event = await eventsService.updateEvent(userId, eventId, req.body);
            res.json(event);
        } catch (error: any) {
            console.error('Erreur mise à jour événement:', error);
            res.status(error.message?.includes('Non autorisé') ? 403 : 500)
                .json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Supprimer un événement (admin)
     */
    async deleteEvent(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { eventId } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            await eventsService.deleteEvent(userId, eventId);
            res.json({ success: true, message: 'Événement supprimé' });
        } catch (error: any) {
            console.error('Erreur suppression événement:', error);
            res.status(error.message?.includes('Non autorisé') ? 403 : 500)
                .json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Publier un événement (admin)
     */
    async publishEvent(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { eventId } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            const event = await eventsService.publishEvent(userId, eventId);
            res.json(event);
        } catch (error: any) {
            console.error('Erreur publication événement:', error);
            res.status(error.message?.includes('Non autorisé') ? 403 : 500)
                .json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Annuler un événement (admin)
     */
    async cancelEvent(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { eventId } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            const event = await eventsService.cancelEvent(userId, eventId);
            res.json(event);
        } catch (error: any) {
            console.error('Erreur annulation événement:', error);
            res.status(error.message?.includes('Non autorisé') ? 403 : 500)
                .json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Marquer un événement comme terminé (admin)
     */
    async completeEvent(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { eventId } = req.params;
            const { replay_url } = req.body;

            if (!userId) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            const event = await eventsService.completeEvent(userId, eventId, replay_url);
            res.json(event);
        } catch (error: any) {
            console.error('Erreur complétion événement:', error);
            res.status(error.message?.includes('Non autorisé') ? 403 : 500)
                .json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Récupérer tous les événements (admin)
     */
    async getAllEvents(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            const events = await eventsService.getAllEvents(userId);
            res.json(events);
        } catch (error: any) {
            console.error('Erreur récupération événements:', error);
            res.status(error.message === 'Non autorisé' ? 403 : 500)
                .json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Récupérer les événements publiés (public)
     */
    async getPublishedEvents(req: Request, res: Response) {
        try {
            const events = await eventsService.getPublishedEvents();
            res.json(events);
        } catch (error: any) {
            console.error('Erreur récupération événements publiés:', error);
            res.status(500).json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Récupérer les événements à venir (public)
     */
    async getUpcomingEvents(req: Request, res: Response) {
        try {
            const events = await eventsService.getUpcomingEvents();
            res.json(events);
        } catch (error: any) {
            console.error('Erreur récupération événements à venir:', error);
            res.status(500).json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Récupérer les événements passés (public)
     */
    async getPastEvents(req: Request, res: Response) {
        try {
            const events = await eventsService.getPastEvents();
            res.json(events);
        } catch (error: any) {
            console.error('Erreur récupération événements passés:', error);
            res.status(500).json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Récupérer un événement par ID
     */
    async getEventById(req: AuthRequest, res: Response) {
        try {
            const { eventId } = req.params;
            const userId = req.user?.id;

            const event = await eventsService.getEventById(eventId, userId);
            res.json(event);
        } catch (error: any) {
            console.error('Erreur récupération événement:', error);
            res.status(error.message === 'Événement non trouvé' ? 404 : 500)
                .json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * S'inscrire à un événement
     */
    async registerToEvent(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { eventId } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            const result = await eventsService.registerToEvent(userId, eventId);
            res.status(201).json({
                success: true,
                message: result.reactivated
                    ? 'Votre inscription a été réactivée'
                    : 'Inscription réussie',
                registration: result.registration
            });
        } catch (error: any) {
            console.error('Erreur inscription événement:', error);
            res.status(400).json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Annuler son inscription
     */
    async cancelRegistration(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { eventId } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            await eventsService.cancelRegistration(userId, eventId);
            res.json({ success: true, message: 'Inscription annulée' });
        } catch (error: any) {
            console.error('Erreur annulation inscription:', error);
            res.status(400).json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Récupérer mes inscriptions
     */
    async getMyRegistrations(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            const registrations = await eventsService.getUserRegistrations(userId);
            res.json(registrations);
        } catch (error: any) {
            console.error('Erreur récupération inscriptions:', error);
            res.status(500).json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Récupérer les participants d'un événement (admin)
     */
    async getEventParticipants(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { eventId } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            const participants = await eventsService.getEventParticipants(userId, eventId);
            res.json(participants);
        } catch (error: any) {
            console.error('Erreur récupération participants:', error);
            res.status(error.message === 'Non autorisé' ? 403 : 500)
                .json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Marquer la présence (admin)
     */
    async markAttendance(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const { registrationId } = req.params;
            const { attended } = req.body;

            if (!userId) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            const registration = await eventsService.markAttendance(userId, registrationId, attended);
            res.json(registration);
        } catch (error: any) {
            console.error('Erreur marquage présence:', error);
            res.status(error.message === 'Non autorisé' ? 403 : 500)
                .json({ error: error.message || 'Erreur serveur' });
        }
    },

    /**
     * Vérifier si admin autorisé
     */
    async checkAdminAccess(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;

            console.log('[Events] checkAdminAccess called, userId:', userId, 'user:', req.user);

            if (!userId) {
                console.log('[Events] No userId, returning 401');
                return res.status(401).json({ error: 'Non authentifié' });
            }

            const isAdmin = await eventsService.isAuthorizedAdmin(userId);
            console.log('[Events] isAdmin result:', isAdmin);
            res.json({ isAdmin });
        } catch (error: any) {
            console.error('Erreur vérification admin:', error);
            res.status(500).json({ error: error.message || 'Erreur serveur' });
        }
    }
};
