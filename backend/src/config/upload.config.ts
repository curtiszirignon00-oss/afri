// src/config/upload.config.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Racine absolue des uploads (fallback disque local en dev) — basée sur le CWD
// (pas sur __dirname, qui change avec le bundling esbuild où tout est compilé dans dist/index.js).
const rawUploadPath = process.env.UPLOAD_PATH || 'public/uploads';
export const UPLOADS_ROOT = path.isAbsolute(rawUploadPath)
    ? rawUploadPath
    : path.resolve(process.cwd(), rawUploadPath);

const UPLOAD_SUBDIRS = ['avatars', 'banners', 'posts', 'docs'] as const;
type UploadSubdir = (typeof UPLOAD_SUBDIRS)[number];

// ============================================================
// Cloudflare R2 (stockage objet persistant) — actif si configuré
// ============================================================
const R2_BUCKET = process.env.R2_BUCKET || '';
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
export const R2_ENABLED = !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    R2_BUCKET &&
    R2_PUBLIC_URL
);

let _s3: S3Client | null = null;
function getS3(): S3Client {
    if (!_s3) {
        _s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            },
        });
    }
    return _s3;
}

export interface PersistedFile {
    url: string;
    filename: string;
    key: string;
}

/**
 * Persiste un fichier uploadé (buffer mémoire) : sur R2 si configuré, sinon sur disque local.
 * Retourne l'URL publique, le nom de fichier et la clé objet.
 */
export async function persistFile(file: Express.Multer.File, subdir: UploadSubdir): Promise<PersistedFile> {
    const ext = MIME_TO_EXT[file.mimetype] ?? (
        file.mimetype === 'application/pdf' ? '.pdf'
            : file.mimetype === 'text/html' ? '.html'
                : ''
    );
    const filename = `${uuidv4()}${ext}`;
    const key = `${subdir}/${filename}`;

    if (R2_ENABLED) {
        await getS3().send(
            new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
            })
        );
        return { url: `${R2_PUBLIC_URL}/${key}`, filename, key };
    }

    // Fallback disque local (dev sans R2)
    const dir = path.join(UPLOADS_ROOT, subdir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), file.buffer);
    return { url: getPublicUrl(filename, subdir), filename, key };
}

// Créer les dossiers d'upload s'ils n'existent pas
const createUploadDirs = () => {
    [UPLOADS_ROOT, ...UPLOAD_SUBDIRS.map((d) => path.join(UPLOADS_ROOT, d))].forEach((fullPath) => {
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`📁 Dossier créé: ${fullPath}`);
        }
    });
};

// Créer les dossiers au démarrage (uniquement en mode disque local)
if (!process.env.R2_BUCKET) {
    createUploadDirs();
}

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

// Stockage en mémoire : le buffer est ensuite persisté via persistFile() (R2 ou disque).
const storage = multer.memoryStorage();

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

// Filtre dédié aux fichiers HTML (contenus riches : deal flow, analyses…)
const htmlFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = file.mimetype === 'text/html' || file.mimetype === 'application/xhtml+xml';
    if (mimeOk && (ext === '.html' || ext === '.htm')) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé. Seuls les fichiers .html sont acceptés.'));
    }
};

// Upload d'un fichier HTML (Deal Flow, Analyses, Annonces…)
export const uploadHtml = multer({
    storage,
    fileFilter: htmlFileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5MB
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

/** Dérive la clé objet ('posts/x.jpg') depuis une URL complète ou un chemin. */
function toObjectKey(input: string): string {
    let p = input;
    try {
        p = new URL(input).pathname; // URL complète (R2 ou backend) → pathname
    } catch {
        // pas une URL absolue : on garde tel quel
    }
    // retire un éventuel '/' initial et le préfixe 'uploads/'
    return p.replace(/^\/+/, '').replace(/^uploads\//, '');
}

// Fonction pour supprimer un fichier (R2 ou disque local)
export const deleteFile = async (filePathOrUrl: string): Promise<void> => {
    const key = toObjectKey(filePathOrUrl);
    if (!key) return;

    if (R2_ENABLED) {
        try {
            await getS3().send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
        } catch (err) {
            console.error('Erreur suppression objet R2:', err);
        }
        return;
    }

    // Fallback disque local
    const fullPath = path.join(UPLOADS_ROOT, key);
    if (fs.existsSync(fullPath)) {
        try {
            fs.unlinkSync(fullPath);
            console.log(`🗑️ Fichier supprimé: ${fullPath}`);
        } catch (err) {
            console.error('Erreur suppression fichier:', err);
        }
    }
};

// Fonction pour extraire le chemin du fichier depuis l'URL (compat ascendante)
export const getFilePathFromUrl = (url: string): string | null => {
    if (!url) return null;
    return toObjectKey(url) || null;
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
