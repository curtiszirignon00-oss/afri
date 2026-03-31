import { log } from '../config/logger';
// src/controllers/upload.controller.ts
import { Request, Response, NextFunction } from 'express';
import { uploadAvatar, uploadBanner, uploadPostImages, getPublicUrl, deleteFile, getFilePathFromUrl } from '../config/upload.config';
import { prisma } from '../config/database';

// ========================================
// UPLOAD AVATAR
// ========================================

export async function handleAvatarUpload(req: Request, res: Response, next: NextFunction) {
    uploadAvatar(req, res, async (err) => {
        try {
            if (err) {
                log.error('❌ Erreur upload avatar:', err.message);
                return res.status(400).json({
                    success: false,
                    message: err.message || 'Erreur lors de l\'upload de l\'avatar'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun fichier fourni'
                });
            }

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Non autorisé'
                });
            }

            // Générer l'URL publique
            const avatarUrl = getPublicUrl(req.file.filename, 'avatars');

            // Récupérer l'ancien avatar pour le supprimer
            const existingProfile = await prisma.userProfile.findUnique({
                where: { userId },
                select: { avatar_url: true }
            });

            // Supprimer l'ancien avatar si existe
            if (existingProfile?.avatar_url) {
                const oldFilePath = getFilePathFromUrl(existingProfile.avatar_url);
                if (oldFilePath) {
                    try {
                        await deleteFile(oldFilePath);
                    } catch (e) {
                        log.warn('Impossible de supprimer l\'ancien avatar:', e);
                    }
                }
            }

            // Mettre à jour le profil avec la nouvelle URL
            const updatedProfile = await prisma.userProfile.upsert({
                where: { userId },
                update: { avatar_url: avatarUrl },
                create: {
                    userId,
                    avatar_url: avatarUrl
                }
            });

            log.debug(`✅ Avatar uploadé pour user ${userId}: ${avatarUrl}`);

            return res.status(200).json({
                success: true,
                message: 'Avatar mis à jour avec succès',
                data: {
                    avatar_url: avatarUrl,
                    filename: req.file.filename
                }
            });

        } catch (error: any) {
            log.error('❌ Erreur handleAvatarUpload:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de l\'upload'
            });
        }
    });
}

// ========================================
// UPLOAD BANNER
// ========================================

export async function handleBannerUpload(req: Request, res: Response, next: NextFunction) {
    uploadBanner(req, res, async (err) => {
        try {
            if (err) {
                log.error('❌ Erreur upload banner:', err.message);
                return res.status(400).json({
                    success: false,
                    message: err.message || 'Erreur lors de l\'upload de la bannière'
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun fichier fourni'
                });
            }

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Non autorisé'
                });
            }

            // Générer l'URL publique
            const bannerUrl = getPublicUrl(req.file.filename, 'banners');

            // Récupérer l'ancienne bannière pour la supprimer
            const existingProfile = await prisma.userProfile.findUnique({
                where: { userId },
                select: { banner_url: true }
            });

            // Supprimer l'ancienne bannière si existe
            if (existingProfile?.banner_url) {
                const oldFilePath = getFilePathFromUrl(existingProfile.banner_url);
                if (oldFilePath) {
                    try {
                        await deleteFile(oldFilePath);
                    } catch (e) {
                        log.warn('Impossible de supprimer l\'ancienne bannière:', e);
                    }
                }
            }

            // Mettre à jour le profil avec la nouvelle URL
            const updatedProfile = await prisma.userProfile.upsert({
                where: { userId },
                update: {
                    banner_url: bannerUrl,
                    banner_type: 'image'
                },
                create: {
                    userId,
                    banner_url: bannerUrl,
                    banner_type: 'image'
                }
            });

            log.debug(`✅ Bannière uploadée pour user ${userId}: ${bannerUrl}`);

            return res.status(200).json({
                success: true,
                message: 'Bannière mise à jour avec succès',
                data: {
                    banner_url: bannerUrl,
                    filename: req.file.filename
                }
            });

        } catch (error: any) {
            log.error('❌ Erreur handleBannerUpload:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de l\'upload'
            });
        }
    });
}

// ========================================
// UPLOAD POST IMAGES
// ========================================

export async function handlePostImagesUpload(req: Request, res: Response, next: NextFunction) {
    uploadPostImages(req, res, async (err) => {
        try {
            if (err) {
                log.error('❌ Erreur upload images post:', err.message);
                return res.status(400).json({
                    success: false,
                    message: err.message || 'Erreur lors de l\'upload des images'
                });
            }

            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucun fichier fourni'
                });
            }

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Non autorisé'
                });
            }

            // Générer les URLs publiques pour toutes les images
            const imageUrls = files.map(file => getPublicUrl(file.filename, 'posts'));

            log.debug(`✅ ${files.length} image(s) uploadée(s) pour user ${userId}`);

            return res.status(200).json({
                success: true,
                message: `${files.length} image(s) uploadée(s) avec succès`,
                data: {
                    images: imageUrls,
                    filenames: files.map(f => f.filename)
                }
            });

        } catch (error: any) {
            log.error('❌ Erreur handlePostImagesUpload:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur serveur lors de l\'upload'
            });
        }
    });
}

// ========================================
// DELETE IMAGE
// ========================================

export async function handleDeleteImage(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Non autorisé'
            });
        }

        const { type, filename } = req.params;

        if (!type || !filename) {
            return res.status(400).json({
                success: false,
                message: 'Type et nom de fichier requis'
            });
        }

        const validTypes = ['avatars', 'banners', 'posts'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ success: false, message: 'Type de fichier invalide' });
        }

        // Valider que le filename est strictement UUID + extension — élimine tout path traversal possible
        const UUID_FILE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|gif|webp)$/i;
        if (!UUID_FILE_RE.test(filename)) {
            return res.status(400).json({ success: false, message: 'Nom de fichier invalide' });
        }

        // ─── IDOR : vérifier que le fichier appartient bien à cet utilisateur ───
        const profile = await prisma.userProfile.findUnique({
            where: { userId },
            select: { avatar_url: true, banner_url: true }
        });

        if (type === 'avatars') {
            if (!profile?.avatar_url?.includes(filename)) {
                return res.status(403).json({ success: false, message: 'Accès refusé' });
            }
        } else if (type === 'banners') {
            if (!profile?.banner_url?.includes(filename)) {
                return res.status(403).json({ success: false, message: 'Accès refusé' });
            }
        } else if (type === 'posts') {
            // Les images sont stockées comme URLs complètes — vérifier en JS
            const userPosts = await prisma.post.findMany({
                where: { author_id: userId },
                select: { images: true }
            });
            const ownsFile = userPosts.some((p) =>
                Array.isArray(p.images) && (p.images as string[]).some((img) => img.includes(filename))
            );
            if (!ownsFile) {
                return res.status(403).json({ success: false, message: 'Accès refusé' });
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        const filePath = `uploads/${type}/${filename}`;
        await deleteFile(filePath);

        // Mettre à jour le profil si avatar ou bannière
        if (type === 'avatars') {
            await prisma.userProfile.update({
                where: { userId },
                data: { avatar_url: null }
            });
        } else if (type === 'banners') {
            await prisma.userProfile.update({
                where: { userId },
                data: { banner_url: null, banner_type: 'gradient' }
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Image supprimée avec succès'
        });

    } catch (error: any) {
        log.error('❌ Erreur handleDeleteImage:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression'
        });
    }
}
