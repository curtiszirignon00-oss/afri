// src/lib/sanitize.ts
import DOMPurify from 'dompurify';

/**
 * Sanitize user-generated content to prevent XSS attacks
 * @param content - Raw content from user
 * @returns Sanitized safe content
 */
export function sanitizeContent(content: string): string {
    if (!content) return '';

    // Configure DOMPurify
    const config = {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
        SAFE_FOR_TEMPLATES: true,
    };

    return DOMPurify.sanitize(content, config);
}

/**
 * Sanitize content for plain text display (strips all HTML)
 * @param content - Raw content from user
 * @returns Plain text without HTML
 */
export function sanitizePlainText(content: string): string {
    if (!content) return '';

    return DOMPurify.sanitize(content, { ALLOWED_TAGS: [] });
}

/**
 * Check if content contains potentially dangerous elements
 * @param content - Content to check
 * @returns true if content seems unsafe
 */
export function isContentSuspicious(content: string): boolean {
    if (!content) return false;

    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i, // Event handlers
        /<iframe/i,
        /<object/i,
        /<embed/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
}
