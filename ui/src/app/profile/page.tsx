'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import UserAvatar from '@/components/UserAvatar';

export default function Profile() {
    const router = useRouter();
    const { isLoading, accessToken, logout, authFetch } = useAuth();
    const { user } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [editedDisplayName, setEditedDisplayName] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user?.displayName) {
            setEditedDisplayName(user.displayName);
        }
    }, [user]);

    useEffect(() => {
        if (!isLoading && !accessToken) {
            router.push('/auth/login');
        }
    }, [accessToken, isLoading, router]);

    const handleEditName = async () => {
        if (!editedDisplayName.trim()) {
            setError('Display name cannot be empty');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const response = await authFetch(
                `${process.env.NEXT_PUBLIC_USER_SERVICE_BASE_URL}/api/user/me`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        displayName: editedDisplayName.trim(),
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            // Refresh page to get updated user data
            setIsEditing(false);
            window.location.reload();
        } catch (err) {
            setError('Failed to update profile. Please try again.');
            console.error('Update profile error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProfile = async () => {
        if (!user?.google_id) return;

        setIsDeleting(true);
        setError('');

        try {
            const response = await authFetch(
                `${process.env.NEXT_PUBLIC_USER_SERVICE_BASE_URL}/api/user/me`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete profile');
            }

            await logout();
        } catch (err) {
            setError('Failed to delete profile. Please try again.');
            console.error('Delete profile error:', err);
            setIsDeleting(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (max 1MB)
        if (file.size > 1 * 1024 * 1024) {
            setError('Image must be less than 1MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setSelectedImage(event.target?.result as string);
            setError('');
        };
        reader.readAsDataURL(file);
    };

    const handleUploadImage = async () => {
        if (!selectedImage) return;

        setIsSaving(true);
        setError('');

        try {
            const response = await authFetch(
                `${process.env.NEXT_PUBLIC_USER_SERVICE_BASE_URL}/api/user/me`,
                {
                    method: 'PUT',
                    body: JSON.stringify({
                        image: selectedImage,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            setSelectedImage(null);
            window.location.reload();
        } catch (err) {
            setError('Failed to upload image. Please try again.');
            console.error('Upload image error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const cancelEdit = () => {
        setEditedDisplayName(user?.displayName || '');
        setIsEditing(false);
        setError('');
    };

    const cancelImageUpload = () => {
        setSelectedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setError('');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
        );
    }

    if (!accessToken || !user) {
        return null;
    }

    return (
        <>
            <Header />
            <div className="min-h-[calc(100vh-4rem)] bg-gray-900 py-12 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-full">
                    <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden flex-col item-center w-full border border-gray-700">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-8">
                            <div className="flex items-center">
                                {/* Profile Picture */}
                                <div className="flex-shrink-0">
                                    <UserAvatar
                                        image={user.image}
                                        picture={user.picture}
                                        displayName={user.displayName}
                                        size="xl"
                                        border="thick"
                                    />
                                </div>

                                {/* User Info */}
                                <div className="ml-6">
                                    <h1 className="text-3xl font-bold text-gray-100">
                                        {user.displayName || "No Name Set"}
                                    </h1>
                                    <p className="text-gray-300 mt-1">
                                        {user.email || "No Email"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-6">
                            {error && (
                                <div className="mb-6 bg-red-900 border border-red-700 rounded-md p-4">
                                    <p className="text-sm text-red-200">{error}</p>
                                </div>
                            )}

                            {/* Edit Display Name Section */}
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-gray-100 mb-4">Profile Information</h2>

                                <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                                    <label className="block text-sm font-medium text-gray-200 mb-2">
                                        Name
                                    </label>

                                    {isEditing ? (
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="text"
                                                value={editedDisplayName}
                                                onChange={(e) => setEditedDisplayName(e.target.value)}
                                                className="text-black bg-gray-100 flex-1 border border-gray-500 rounded-md px-3 py-2 focus:ring-blue-400 focus:border-blue-400"
                                                placeholder="Enter your display name"
                                                disabled={isSaving}
                                            />
                                            <button
                                                onClick={handleEditName}
                                                disabled={isSaving || !editedDisplayName.trim()}
                                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                            >
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                disabled={isSaving}
                                                className="border border-gray-500 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-200">
                                                {user.displayName || "No name set"}
                                            </span>
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Profile Picture Upload */}
                                <div className="border border-gray-600 rounded-lg p-4 mt-4 bg-gray-700">
                                    <label className="block text-sm font-medium text-gray-200 mb-2">
                                        Profile Picture
                                    </label>

                                    <div className="space-y-3">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="hidden"
                                            disabled={isSaving}
                                        />

                                        {selectedImage ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-4">
                                                    {/* Custom preview for unsaved image */}
                                                    <Image
                                                        src={selectedImage}
                                                        alt="Preview"
                                                        width={64}
                                                        height={64}
                                                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
                                                        unoptimized
                                                    />
                                                    <span className="text-gray-300 text-sm">New image selected</span>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <button
                                                        onClick={handleUploadImage}
                                                        disabled={isSaving}
                                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                                    >
                                                        {isSaving ? 'Uploading...' : 'Save Image'}
                                                    </button>
                                                    <button
                                                        onClick={cancelImageUpload}
                                                        disabled={isSaving}
                                                        className="border border-gray-500 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-200 text-sm">
                                                    {user?.image ? 'Custom image uploaded' : (user?.picture ? 'Using Google profile picture' : 'No picture set')}
                                                </span>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                                >
                                                    Upload Image
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="border border-red-600 rounded-lg p-4 bg-red-900/20">
                                <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
                                <p className="text-sm text-red-300 mb-4">
                                    Once you delete your profile, there is no going back. Please be certain.
                                </p>

                                {showDeleteConfirm ? (
                                    <div className="flex items-center space-x-3">
                                        <p className="text-sm text-red-300">Are you sure? This action cannot be undone.</p>
                                        <button
                                            onClick={handleDeleteProfile}
                                            disabled={isDeleting}
                                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                        >
                                            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(false)}
                                            disabled={isDeleting}
                                            className="border border-gray-500 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Delete Profile
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
