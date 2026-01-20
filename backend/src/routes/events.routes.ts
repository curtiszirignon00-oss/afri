// src/routes/events.routes.ts
import { Router } from 'express';
import { eventsController } from '../controllers/events.controller';
import { auth, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

// =============================================
// ROUTES PUBLIQUES (pas d'authentification requise)
// =============================================

// Récupérer les événements publiés
router.get('/published', eventsController.getPublishedEvents);

// Récupérer les événements à venir
router.get('/upcoming', eventsController.getUpcomingEvents);

// Récupérer les événements passés
router.get('/past', eventsController.getPastEvents);

// =============================================
// ROUTES AUTHENTIFIÉES (utilisateur connecté)
// =============================================

// Récupérer mes inscriptions (DOIT être avant /:eventId)
router.get('/my/registrations', auth, eventsController.getMyRegistrations);

// =============================================
// ROUTES ADMIN (contact@africbourse.com ou superadmin)
// DOIVENT être avant /:eventId pour éviter les conflits
// =============================================

// Vérifier si l'utilisateur est admin des événements
router.get('/admin/check', auth, eventsController.checkAdminAccess);

// Récupérer tous les événements (incluant brouillons)
router.get('/admin/all', auth, eventsController.getAllEvents);

// Créer un nouvel événement
router.post('/admin/create', auth, eventsController.createEvent);

// Mettre à jour un événement
router.put('/admin/:eventId', auth, eventsController.updateEvent);

// Supprimer un événement
router.delete('/admin/:eventId', auth, eventsController.deleteEvent);

// Publier un événement
router.post('/admin/:eventId/publish', auth, eventsController.publishEvent);

// Annuler un événement
router.post('/admin/:eventId/cancel', auth, eventsController.cancelEvent);

// Marquer un événement comme terminé
router.post('/admin/:eventId/complete', auth, eventsController.completeEvent);

// Récupérer les participants d'un événement
router.get('/admin/:eventId/participants', auth, eventsController.getEventParticipants);

// Marquer la présence d'un participant
router.patch('/admin/attendance/:registrationId', auth, eventsController.markAttendance);

// =============================================
// ROUTES AVEC PARAMÈTRES DYNAMIQUES (à la fin)
// =============================================

// Récupérer un événement par ID (optionnel auth pour voir les détails de réunion)
router.get('/:eventId', optionalAuth, eventsController.getEventById);

// S'inscrire à un événement
router.post('/:eventId/register', auth, eventsController.registerToEvent);

// Annuler son inscription
router.delete('/:eventId/register', auth, eventsController.cancelRegistration);

export default router;
