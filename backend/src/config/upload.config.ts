// src/config/upload.config.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Racine absolue des uploads — basée sur le CWD (pas sur __dirname, qui change
// avec le bundling esbuild où tout est compilé dans dist/index.js).
// Garantit que l'écriture des fichiers et leur serving statique pointent au même endroit.
const rawUploadPath = process.env.UPLOAD_PATH || 'public/uploads';
export const UPLOADS_ROOT = path.isAbsolute(rawUploadPath)
    ? rawUploadPath
    : path.resolve(process.cwd(), rawUploadPath);

const UPLOAD_SUBDIRS = ['avatars', 'banners', 'posts', 'docs'] as const;

// Créer les dossiers d'upload s'ils n'existent pas
const createUploadDirs = () => {
    [UPLOADS_ROOT, ...UPLOAD_SUBDIRS.map((d) => path.join(UPLOADS_ROOT, d))].forEach((fullPath) => {
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

// Extension canonique dérivée du MIME type — ne jamais faire confiance au nom original
const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
};

// Extensions autorisées (pour validation en entrée uniquement)
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Tailles maximales par type (en bytes)
const MAX_FILE_SIZES = {
    avatar: 5 * 1024 * 1024,    // 5MB
    banner: 10 * 1024 * 1024,   // 10MB
    post: 10 * 1024 * 1024      // 10MB par image
};

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req: Request, file, cb) => {
        // Déterminer le sous-dossier selon le type d'upload
        let subdir = '';

        if (req.path.includes('avatar')) {
            subdir = 'avatars';
        } else if (req.path.includes('banner')) {
            subdir = 'banners';
        } else if (req.path.includes('pdf') || req.path.includes('doc')) {
            subdir = 'docs';
        } else if (req.path.includes('post')) {
            subdir = 'posts';
        }

        cb(null, path.join(UPLOADS_ROOT, subdir));
    },
    filename: (req, file, cb) => {
        // Extension dérivée du MIME type — jamais du nom original fourni par le client
        const ext = MIME_TO_EXT[file.mimetype] ?? (file.mimetype === 'application/pdf' ? '.pdf' : '.jpg');
        cb(null, `${uuidv4()}${ext}`);
    }
});

// Filtre dédié aux PDF
const pdfFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype === 'application/pdf' && ext === '.pdf') {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé. Seuls les PDF sont acceptés.'));
    }
};

// Upload d'un document PDF (Annonces, Récaps)
export const uploadPdf = multer({
    storage,
    fileFilter: pdfFileFilter,
    limits: { fileSize: 20 * 1024 * 1024, files: 1 }, // 20MB
}).single('file');

// Filtre de fichiers — double validation MIME + extension
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const extOk = ALLOWED_EXTENSIONS.includes(ext);

    if (mimeOk && extOk) {
        cb(null, true);
    } else {
        cb(new Error(`Type de fichier non autorisé. Extensions acceptées: ${ALLOWED_EXTENSIONS.join(', ')}`));
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

// Upload d'une seule image (couverture article, etc.)
export const uploadSingleImage = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZES.post, files: 1 },
}).single('image');

// Fonction utilitaire pour obtenir l'URL publique d'un fichier
export const getPublicUrl = (filename: string, type: 'avatars' | 'banners' | 'posts' | 'docs'): string => {
    const raw = process.env.BACKEND_URL || 'http://localhost:3001';
    // Garantit une URL absolue valide même si BACKEND_URL est défini sans schéma
    const baseUrl = (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).replace(/\/$/, '');
    return `${baseUrl}/uploads/${type}/${filename}`;
};

// Fonction pour supprimer un fichier
export const deleteFile = (filePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Normalise : accepte 'uploads/posts/x.jpg', '/uploads/posts/x.jpg' ou 'posts/x.jpg'
        const relative = filePath.replace(/^\/?uploads\//, '');
        const fullPath = path.join(UPLOADS_ROOT, relative);

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
