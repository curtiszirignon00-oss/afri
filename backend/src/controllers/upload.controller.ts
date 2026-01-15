// src/controllers/upload.controller.ts
import { Request, Response, NextFunction } from 'express';
import { uploadAvatar, uploadBanner, uploadPostImages, getPublicUrl, deleteFile, getFilePathFromUrl } from '../config/upload.config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ========================================
// UPLOAD AVATAR
// ========================================

export async function handleAvatarUpload(req: Request, res: Response, next: NextFunction) {
    uploadAvatar(req, res, async (err) => {
        try {
            if (err) {
                console.error('❌ Erreur upload avatar:', err.message);
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
                        console.warn('Impossible de supprimer l\'ancien avatar:', e);
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

            console.log(`✅ Avatar uploadé pour user ${userId}: ${avatarUrl}`);

            return res.status(200).json({
                success: true,
                message: 'Avatar mis à jour avec succès',
                data: {
                    avatar_url: avatarUrl,
                    filename: req.file.filename
                }
            });

        } catch (error: any) {
            console.error('❌ Erreur handleAvatarUpload:', error);
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
                console.error('❌ Erreur upload banner:', err.message);
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
                        console.warn('Impossible de supprimer l\'ancienne bannière:', e);
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

            console.log(`✅ Bannière uploadée pour user ${userId}: ${bannerUrl}`);

            return res.status(200).json({
                success: true,
                message: 'Bannière mise à jour avec succès',
                data: {
                    banner_url: bannerUrl,
                    filename: req.file.filename
                }
            });

        } catch (error: any) {
            console.error('❌ Erreur handleBannerUpload:', error);
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
                console.error('❌ Erreur upload images post:', err.message);
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

            console.log(`✅ ${files.length} image(s) uploadée(s) pour user ${userId}`);

            return res.status(200).json({
                success: true,
                message: `${files.length} image(s) uploadée(s) avec succès`,
                data: {
                    images: imageUrls,
                    filenames: files.map(f => f.filename)
                }
            });

        } catch (error: any) {
            console.error('❌ Erreur handlePostImagesUpload:', error);
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
            return res.status(400).json({
                success: false,
                message: 'Type de fichier invalide'
            });
        }

        const filePath = `uploads/${type}/${filename}`;
        await deleteFile(filePath);

        // Si c'est un avatar ou une bannière, mettre à jour le profil
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
        console.error('❌ Erreur handleDeleteImage:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression'
        });
    }
}
