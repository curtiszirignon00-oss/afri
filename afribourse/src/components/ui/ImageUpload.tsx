// src/components/ui/ImageUpload.tsx
import { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { validateImageFile, createImagePreview } from '../../hooks/useUpload';

interface ImageUploadProps {
    onUpload: (file: File) => void;
    currentImage?: string | null;
    type: 'avatar' | 'banner' | 'post';
    isLoading?: boolean;
    className?: string;
    showPreview?: boolean;
    multiple?: boolean;
    maxFiles?: number;
    onMultipleUpload?: (files: File[]) => void;
}

export default function ImageUpload({
    onUpload,
    currentImage,
    type,
    isLoading = false,
    className = '',
    showPreview = true,
    multiple = false,
    maxFiles = 5,
    onMultipleUpload
}: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const maxSizeMB = type === 'avatar' ? 5 : 10;

    const handleFileSelect = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setError(null);

        if (multiple && onMultipleUpload) {
            const validFiles: File[] = [];
            const newPreviews: string[] = [];

            for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
                const file = files[i];
                const validation = validateImageFile(file, { maxSizeMB });

                if (!validation.valid) {
                    setError(validation.error || 'Fichier invalide');
                    continue;
                }

                validFiles.push(file);
                const previewUrl = await createImagePreview(file);
                newPreviews.push(previewUrl);
            }

            if (validFiles.length > 0) {
                setPreviews(newPreviews);
                onMultipleUpload(validFiles);
            }
        } else {
            const file = files[0];
            const validation = validateImageFile(file, { maxSizeMB });

            if (!validation.valid) {
                setError(validation.error || 'Fichier invalide');
                return;
            }

            if (showPreview) {
                const previewUrl = await createImagePreview(file);
                setPreview(previewUrl);
            }

            onUpload(file);
        }
    }, [multiple, maxFiles, maxSizeMB, onUpload, onMultipleUpload, showPreview]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files);
    };

    const clearPreview = () => {
        setPreview(null);
        setPreviews([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Rendu pour Avatar
    if (type === 'avatar') {
        return (
            <div className={`relative ${className}`}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                />
                <button
                    onClick={handleClick}
                    disabled={isLoading}
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                    title="Changer l'avatar"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                    ) : (
                        <Camera className="w-4 h-4 text-gray-600" />
                    )}
                </button>
                {error && (
                    <p className="absolute -bottom-6 left-0 text-xs text-red-500">{error}</p>
                )}
            </div>
        );
    }

    // Rendu pour Banner
    if (type === 'banner') {
        return (
            <div className={`relative ${className}`}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                />
                <button
                    onClick={handleClick}
                    disabled={isLoading}
                    className="absolute top-4 right-4 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 z-10"
                    title="Changer la bannière"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Camera className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                        {isLoading ? 'Upload...' : 'Modifier'}
                    </span>
                </button>
                {error && (
                    <div className="absolute top-16 right-4 bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
                        {error}
                    </div>
                )}
            </div>
        );
    }

    // Rendu pour Post Images (Zone de drop)
    return (
        <div className={className}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
                multiple={multiple}
            />

            <div
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                    border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                    ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        <p className="text-sm text-gray-500">Upload en cours...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                        <p className="text-sm text-gray-600">
                            Cliquez ou glissez-déposez vos images
                        </p>
                        <p className="text-xs text-gray-400">
                            Max {maxFiles} images, {maxSizeMB}MB chacune
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-2 text-xs text-red-500">{error}</p>
            )}

            {/* Previews pour multiple */}
            {previews.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {previews.map((src, idx) => (
                        <div key={idx} className="relative">
                            <img
                                src={src}
                                alt={`Preview ${idx + 1}`}
                                className="w-16 h-16 object-cover rounded-lg"
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newPreviews = previews.filter((_, i) => i !== idx);
                                    setPreviews(newPreviews);
                                }}
                                className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Preview unique */}
            {preview && !multiple && (
                <div className="mt-3 relative inline-block">
                    <img
                        src={preview}
                        alt="Preview"
                        className="max-h-32 rounded-lg"
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            clearPreview();
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
