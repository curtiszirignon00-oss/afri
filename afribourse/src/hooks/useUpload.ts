// src/hooks/useUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../config/api';
import toast from 'react-hot-toast';

// Helper pour récupérer le token
const getAuthToken = (): string | null => {
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
};

// Types
interface UploadResponse {
    success: boolean;
    message: string;
    data: {
        avatar_url?: string;
        banner_url?: string;
        images?: string[];
        filename?: string;
        filenames?: string[];
    };
}

// ========================================
// UPLOAD AVATAR
// ========================================

export function useUploadAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File): Promise<UploadResponse> => {
            const formData = new FormData();
            formData.append('avatar', file);

            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de l\'upload');
            }

            return response.json();
        },
        onSuccess: (data) => {
            toast.success('Avatar mis à jour avec succès !');
            // Invalider les caches pertinents
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['investor-profile'] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de l\'upload de l\'avatar');
        }
    });
}

// ========================================
// UPLOAD BANNER
// ========================================

export function useUploadBanner() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File): Promise<UploadResponse> => {
            const formData = new FormData();
            formData.append('banner', file);

            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/upload/banner`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de l\'upload');
            }

            return response.json();
        },
        onSuccess: (data) => {
            toast.success('Bannière mise à jour avec succès !');
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['investor-profile'] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de l\'upload de la bannière');
        }
    });
}

// ========================================
// UPLOAD POST IMAGES
// ========================================

export function useUploadPostImages() {
    return useMutation({
        mutationFn: async (files: File[]): Promise<UploadResponse> => {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('images', file);
            });

            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/upload/post-images`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de l\'upload');
            }

            return response.json();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de l\'upload des images');
        }
    });
}

// ========================================
// DELETE IMAGE
// ========================================

export function useDeleteImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ type, filename }: { type: string; filename: string }) => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/upload/${type}/${filename}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de la suppression');
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success('Image supprimée');
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de la suppression');
        }
    });
}

// ========================================
// UPDATE PROFILE
// ========================================

export interface ProfileUpdateData {
    username?: string;
    bio?: string;
    country?: string;
    social_links?: {
        linkedin?: string;
        twitter?: string;
        website?: string;
        instagram?: string;
        facebook?: string;
    };
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ProfileUpdateData) => {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/profile/me`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de la mise à jour');
            }

            return response.json();
        },
        onSuccess: () => {
            toast.success('Profil mis à jour !');
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['user'] });
            queryClient.invalidateQueries({ queryKey: ['investor-profile'] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Erreur lors de la mise à jour du profil');
        }
    });
}

// ========================================
// HELPERS
// ========================================

// Valider le fichier côté client avant upload
export function validateImageFile(file: File, options?: {
    maxSizeMB?: number;
    allowedTypes?: string[];
}): { valid: boolean; error?: string } {
    const {
        maxSizeMB = 5,
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    } = options || {};

    // Vérifier le type
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`
        };
    }

    // Vérifier la taille
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return {
            valid: false,
            error: `Fichier trop volumineux. Taille maximum: ${maxSizeMB}MB`
        };
    }

    return { valid: true };
}

// Créer une preview d'image
export function createImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(e.target?.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
