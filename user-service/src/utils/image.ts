/**
 * Utility functions for handling base64 image data URLs and Buffers
 */

export interface ParsedImage {
    buffer: Buffer;
    mimeType: string;
}

/**
 * Convert a base64 data URL to a Buffer and extract MIME type for storage
 * @param dataUrl - The base64 data URL (e.g., "data:image/png;base64,...")
 * @returns Object with buffer and mimeType, or null if invalid
 */
export function dataUrlToBuffer(dataUrl: string): ParsedImage | null {
    // Handle various MIME types including jpeg, png, gif, webp, svg+xml, etc.
    const [_, mimeType, base64Data] = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/) || [null, null, null];
    if (!mimeType || !base64Data) {
        console.error('Failed to parse data URL:', dataUrl.substring(0, 50) + '...');
        return null;
    }
    return {
        buffer: Buffer.from(base64Data, 'base64'),
        mimeType: mimeType
    };
}

/**
 * Convert a Buffer (or MongoDB Binary) to a base64 data URL for response
 * @param buffer - The Buffer or Binary containing image data
 * @param mimeType - The MIME type (default: 'image/png')
 * @returns The base64 data URL string
 */
export function bufferToDataUrl(buffer: any, mimeType: string = 'image/png'): string {
    return `data:${mimeType};base64,${Buffer.from(buffer).toString('base64')}`;
}

/**
 * Format user object for response, converting image Buffer to data URL
 * @param user - The user object from the database
 * @returns Formatted user object with image as data URL
 */
export function formatUserResponse(user: any) {
    if (!user) return user;
    const { image, imageMimeType, ...rest } = user;
    return {
        ...rest,
        image: image ? bufferToDataUrl(image, imageMimeType || 'image/png') : null
    };
}