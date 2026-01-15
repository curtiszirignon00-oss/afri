// src/components/profile/PostComposer.tsx
import { useState, useRef } from 'react';
import { Send, Image, TrendingUp, X, Loader2 } from 'lucide-react';
import { useCreatePost } from '../../hooks/useSocial';
import type { CreatePostData } from '../../hooks/useSocial';
import { useUploadPostImages, validateImageFile, createImagePreview } from '../../hooks/useUpload';
import { Card } from '../ui';
import toast from 'react-hot-toast';

export default function PostComposer() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [type, setType] = useState<CreatePostData['type']>('OPINION');
    const [stockSymbol, setStockSymbol] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const { mutate: createPost, isPending } = useCreatePost();
    const { mutateAsync: uploadImages, isPending: isUploading } = useUploadPostImages();

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles: File[] = [];
        const previews: string[] = [];

        for (const file of files) {
            const validation = validateImageFile(file);
            if (!validation.valid) {
                toast.error(validation.error || 'Fichier invalide');
                continue;
            }
            if (selectedImages.length + validFiles.length >= 4) {
                toast.error('Maximum 4 images par post');
                break;
            }
            validFiles.push(file);
            const preview = await createImagePreview(file);
            previews.push(preview);
        }

        setSelectedImages([...selectedImages, ...validFiles]);
        setImagePreviews([...imagePreviews, ...previews]);

        // Reset input
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(selectedImages.filter((_, i) => i !== index));
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error('Le contenu ne peut pas être vide');
            return;
        }

        try {
            let imageUrls: string[] = [];

            // Upload images first if any
            if (selectedImages.length > 0) {
                const uploadResult = await uploadImages(selectedImages);
                imageUrls = uploadResult.urls;
            }

            const postData: CreatePostData = {
                type,
                content: content.trim(),
                title: title.trim() || undefined,
                stock_symbol: stockSymbol.trim() || undefined,
                tags: tags.length > 0 ? tags : undefined,
                visibility: 'PUBLIC',
                images: imageUrls.length > 0 ? imageUrls : undefined,
            };

            createPost(postData, {
                onSuccess: () => {
                    toast.success('Post publié !');
                    // Reset form
                    setContent('');
                    setTitle('');
                    setStockSymbol('');
                    setTags([]);
                    setSelectedImages([]);
                    setImagePreviews([]);
                    setIsExpanded(false);
                },
                onError: (error: any) => {
                    toast.error(error.response?.data?.error || 'Erreur lors de la publication');
                },
            });
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de l\'upload des images');
        }
    };

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    const isSubmitting = isPending || isUploading;

    return (
        <Card className="p-6">
            {/* Hidden file input */}
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
            />

            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                    U
                </div>

                <div className="flex-1">
                    {!isExpanded ? (
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="w-full text-left px-4 py-3 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            Partagez votre analyse ou opinion...
                        </button>
                    ) : (
                        <div className="space-y-4">
                            {/* Type Selection */}
                            <div className="flex gap-2 flex-wrap">
                                {(['OPINION', 'ANALYSIS', 'QUESTION', 'TRANSACTION'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setType(t)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${type === t
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {t === 'OPINION' && 'Opinion'}
                                        {t === 'ANALYSIS' && 'Analyse'}
                                        {t === 'QUESTION' && 'Question'}
                                        {t === 'TRANSACTION' && 'Transaction'}
                                    </button>
                                ))}
                            </div>

                            {/* Title */}
                            <input
                                type="text"
                                placeholder="Titre (optionnel)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />

                            {/* Content */}
                            <textarea
                                placeholder="Partagez vos réflexions..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />

                            {/* Stock Symbol */}
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Symbole boursier (ex: SNTS)"
                                    value={stockSymbol}
                                    onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Tags */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="Ajouter un tag"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        onClick={addTag}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                                {tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                                            >
                                                #{tag}
                                                <button onClick={() => removeTag(tag)}>
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Image Previews */}
                            {imagePreviews.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg"
                                            />
                                            <button
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={selectedImages.length >= 4}
                                        className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={selectedImages.length >= 4 ? 'Maximum 4 images' : 'Ajouter des images'}
                                    >
                                        <Image className="w-5 h-5" />
                                    </button>
                                    {selectedImages.length > 0 && (
                                        <span className="text-sm text-gray-500">
                                            {selectedImages.length}/4 images
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setIsExpanded(false);
                                            setSelectedImages([]);
                                            setImagePreviews([]);
                                        }}
                                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || !content.trim()}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                {isUploading ? 'Upload...' : 'Publication...'}
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Publier
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
