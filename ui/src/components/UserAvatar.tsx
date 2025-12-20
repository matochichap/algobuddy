'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export interface UserAvatarProps {
    /** User ID to fetch image from API */
    userId?: string | null;
    /** Auth fetch function for authenticated requests */
    authFetch?: (url: string, options?: RequestInit) => Promise<Response>;
    /** Custom uploaded image (takes priority) */
    image?: string | null;
    /** Google/OAuth picture URL (fallback) */
    picture?: string | null;
    /** Display name for alt text and fallback initial */
    displayName?: string | null;
    /** First name as alternative for fallback initial */
    firstName?: string | null;
    /** Size of the avatar in pixels */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Additional CSS classes for the container */
    className?: string;
    /** Border style */
    border?: 'none' | 'thin' | 'thick';
}

const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
};

const sizePixels = {
    xs: 24,
    sm: 32,
    md: 44,
    lg: 64,
    xl: 80,
};

const borderClasses = {
    none: '',
    thin: 'border-2 border-gray-600',
    thick: 'border-4 border-white',
};

/**
 * Get the appropriate image source for a user avatar
 * Priority: image > picture > null
 */
export function getUserImageSrc(
    image?: string | null,
    picture?: string | null
): string | null {
    if (image) return image;
    if (picture) return picture;
    return null;
}

/**
 * Reusable user avatar component that displays profile images with proper fallbacks
 */
export default function UserAvatar({
    userId,
    authFetch,
    image,
    picture,
    displayName,
    firstName,
    size = 'md',
    className = '',
    border = 'thin',
}: UserAvatarProps) {
    const [fetchedImage, setFetchedImage] = useState<string | null>(null);

    // Fetch image from API when userId and authFetch are provided
    useEffect(() => {
        let isMounted = true;

        // Only fetch if we have userId, authFetch, and no other image sources
        if (userId && authFetch && !image) {
            const fetchImage = async () => {
                try {
                    const res = await authFetch(
                        `${process.env.NEXT_PUBLIC_USER_SERVICE_BASE_URL}/api/user/image/${userId}`
                    );

                    if (!res.ok) {
                        return;
                    }

                    const data = await res.json();
                    if (isMounted && data.image) {
                        setFetchedImage(data.image);
                    }
                } catch (err) {
                    console.error('Failed to fetch user image:', err);
                }
            };

            fetchImage();
        }

        return () => {
            isMounted = false;
        };
    }, [userId, authFetch, image]);

    const imageSrc = fetchedImage || getUserImageSrc(image, picture);
    const initial = (displayName || firstName || '?').charAt(0).toUpperCase();
    const sizeClass = sizeClasses[size];
    const borderClass = borderClasses[border];
    const pixelSize = sizePixels[size];

    if (imageSrc) {
        return (
            <Image
                src={imageSrc}
                alt={displayName || 'User avatar'}
                width={pixelSize}
                height={pixelSize}
                className={`${sizeClass} rounded-full object-cover ${borderClass} ${className}`}
                unoptimized={imageSrc.startsWith('data:')}
            />
        );
    }

    return (
        <div
            className={`${sizeClass} bg-gray-700 rounded-full flex items-center justify-center ${borderClass} ${className}`}
        >
            <span className="font-medium text-gray-200">{initial}</span>
        </div>
    );
}
