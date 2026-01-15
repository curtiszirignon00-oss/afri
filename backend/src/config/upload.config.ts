// src/config/upload.config.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Créer les dossiers d'upload s'ils n'existent pas
const createUploadDirs = () => {
    const dirs = [
        'public/uploads',
        'public/uploads/avatars',
        'public/uploads/banners',
        'public/uploads/posts'
    ];

    dirs.forEach(dir => {
        const fullPath = path.join(__dirname, '../../', dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`📁 Dossier créé: ${fullPath}`);
        }
    });
};

// Créer les dossiers au démarrage
createUploadDirs();

// Types de fichiers autorisés
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
];

// Tailles maximales par type (en bytes)
const MAX_FILE_SIZES = {
    avatar: 5 * 1024 * 1024,    // 5MB
    banner: 10 * 1024 * 1024,   // 10MB
    post: 10 * 1024 * 1024      // 10MB par image
};

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req: Request, file, cb) => {
        // Déterminer le dossier selon le type d'upload
        let uploadDir = 'public/uploads';

        if (req.path.includes('avatar')) {
            uploadDir = 'public/uploads/avatars';
        } else if (req.path.includes('banner')) {
            uploadDir = 'public/uploads/banners';
        } else if (req.path.includes('post')) {
            uploadDir = 'public/uploads/posts';
        }

        const fullPath = path.join(__dirname, '../../', uploadDir);
        cb(null, fullPath);
    },
    filename: (req, file, cb) => {
        // Générer un nom unique
        const uniqueSuffix = uuidv4();
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

// Filtre de fichiers
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Type de fichier non autorisé. Types acceptés: ${ALLOWED_MIME_TYPES.join(', ')}`));
    }
};

// Configurations multer pour différents usages
export const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZES.avatar,
        files: 1
    }
}).single('avatar');

export const uploadBanner = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZES.banner,
        files: 1
    }
}).single('banner');

export const uploadPostImages = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZES.post,
        files: 5 // Maximum 5 images par post
    }
}).array('images', 5);

// Fonction utilitaire pour obtenir l'URL publique d'un fichier
export const getPublicUrl = (filename: string, type: 'avatars' | 'banners' | 'posts'): string => {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return `${baseUrl}/uploads/${type}/${filename}`;
};

// Fonction pour supprimer un fichier
export const deleteFile = (filePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const fullPath = path.join(__dirname, '../../public', filePath);

        if (fs.existsSync(fullPath)) {
            fs.unlink(fullPath, (err) => {
                if (err) {
                    console.error('Erreur suppression fichier:', err);
                    reject(err);
                } else {
                    console.log(`🗑️ Fichier supprimé: ${fullPath}`);
                    resolve();
                }
            });
        } else {
            resolve(); // Fichier n'existe pas, pas d'erreur
        }
    });
};

// Fonction pour extraire le chemin du fichier depuis l'URL
export const getFilePathFromUrl = (url: string): string | null => {
    if (!url) return null;

    try {
        const urlObj = new URL(url);
        return urlObj.pathname.replace('/uploads/', '');
    } catch {
        // Si ce n'est pas une URL valide, essayer d'extraire directement
        const match = url.match(/uploads\/(.+)/);
        return match ? match[1] : null;
    }
};

export default {
    uploadAvatar,
    uploadBanner,
    uploadPostImages,
    getPublicUrl,
    deleteFile,
    getFilePathFromUrl,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZES
};
