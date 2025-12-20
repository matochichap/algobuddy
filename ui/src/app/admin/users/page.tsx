'use client';
import Header from '@/components/Header';
import UserAvatar from '@/components/UserAvatar';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from 'shared';
import { useState, useRef } from 'react';
import { getEnumDisplayName } from '@/utils/common';

export default function AdminUsersPage() {
    const { authFetch, refreshAccessToken } = useAuth();

    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<User[]>([]);
    const [selected, setSelected] = useState<User | null>(null);
    const [editing, setEditing] = useState<User | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResults([]);
        setSelected(null);

        const id = query.trim();
        if (!id) return;

        setLoading(true);
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_USER_SERVICE_BASE_URL}/api/user/search?q=${encodeURIComponent(id)}`);
            if (res.ok) {
                const data: User[] = await res.json();
                setResults(data);
                if (data.length > 0) {
                    setSelected(data[0]);
                    setEditing(data[0]);
                } else {
                    setSelected(null);
                    setEditing(null);
                    setError('No users found');
                }
            } else {
                const text = await res.text();
                setError(text || 'Failed to fetch user');
            }
        } catch (err) {
            setError('Failed to fetch user');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editing) return;
        setBusy(true);
        setError(null);
        try {
            const { id, displayName, firstName, lastName, email, role } = editing as User;
            const body: Partial<User> = { displayName, firstName, lastName, email, role };

            // Include image if one was selected
            if (selectedImage) {
                body.image = selectedImage;
            }

            const res = await authFetch(`${process.env.NEXT_PUBLIC_USER_SERVICE_BASE_URL}/api/user/${encodeURIComponent(id)}`, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Update failed');
            }
            const updated = await res.json();
            // Update in results list
            setResults(prev => prev.map(u => u.google_id === updated.google_id ? updated : u));
            setSelected(updated);
            setEditing(updated);
            setSelectedImage(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            console.error(err);
            setError('Failed to update user');
        } finally {
            setBusy(false);
            refreshAccessToken();
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
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const cancelImageSelection = () => {
        setSelectedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        setBusy(true);
        setError(null);
        try {
            const res = await authFetch(`${process.env.NEXT_PUBLIC_USER_SERVICE_BASE_URL}/api/user/${encodeURIComponent(selected.id)}`, {
                method: 'DELETE'
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Delete failed');
            }
            setResults(prev => prev.filter(u => u.id !== selected.id));
            setSelected(null);
            setEditing(null);
            setQuery('');
            setShowDeleteConfirm(false);
        } catch (err) {
            console.error(err);
            setError('Failed to delete user');
        } finally {
            setBusy(false);
            refreshAccessToken();
        }
    };

    return (
        <>
            <Header />
            <div className="h-[calc(100vh-4rem)] bg-gray-900 py-6 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4 flex-shrink-0 h-12">
                        <h1 className="text-2xl font-bold text-gray-100">Manage Users</h1>
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-3 mb-6 flex-shrink-0">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name, email or google_id..."
                            className="flex-1 bg-gray-800 text-gray-100 rounded-lg pl-4 px-2 py-3 text-sm border border-gray-600 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                            disabled={loading || busy}
                        />
                        <button
                            type="submit"
                            disabled={loading || busy || !query.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-1.5 text-sm rounded-lg font-medium transition-colors"
                        >
                            {loading ? 'Searching…' : 'Search'}
                        </button>
                    </form>

                    {error && (
                        <div className="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4 flex-shrink-0">
                            <p className="text-red-200">{error}</p>
                        </div>
                    )}
                    {results.length > 0 && (
                        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 flex-1 min-h-0 overflow-hidden">
                            <div className="xl:col-span-2 bg-gray-800/50 border border-gray-700 rounded-xl p-5 flex flex-col overflow-hidden">
                                <h3 className="text-lg font-semibold text-gray-100 mb-4 flex-shrink-0">{results.length} User{results.length !== 1 ? 's' : ''} Found</h3>
                                <ul className="space-y-3 overflow-y-auto flex-1 pr-2">
                                    {results.map(u => (
                                        <li
                                            key={u.id}
                                            className={`p-4 rounded-lg cursor-pointer transition-all ${selected?.id === u.id
                                                ? 'bg-blue-600/20 border-2 border-blue-500'
                                                : 'bg-gray-800 border border-gray-700 hover:border-gray-500 hover:bg-gray-750'}`}
                                            onClick={() => { setSelected(u); setEditing(u); setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <UserAvatar
                                                    image={u.image}
                                                    picture={u.picture}
                                                    displayName={u.displayName}
                                                    firstName={u.firstName}
                                                    size="md"
                                                    border="thin"
                                                />
                                                <div className="flex-1">
                                                    <div className="text-gray-100 font-medium flex items-center gap-2 mb-1">
                                                        <span>{u.displayName || '(no name)'}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${u.role === 'ADMIN' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-gray-700/50 border-gray-500 text-gray-300'}`}>
                                                            {getEnumDisplayName(u.role || "USER")}
                                                        </span>
                                                    </div>
                                                    {u.email ? <div className="text-sm text-gray-400 break-all">{u.email}</div> : null}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {selected && editing && (
                                <div className="xl:col-span-3 h-full min-h-0">
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 flex flex-col h-full">
                                        <h2 className="text-xl font-semibold text-gray-100 mb-5 flex-shrink-0">Edit User Profile</h2>

                                        <div className="overflow-y-auto flex-1 space-y-3 min-h-0 max-h-full">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-1">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                                                    <input
                                                        className="w-full bg-gray-800 text-gray-100 rounded-lg px-4 py-2.5 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                                        value={editing.displayName || ''}
                                                        onChange={(e) => setEditing({ ...editing, displayName: e.target.value })}
                                                        disabled={busy}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                                                    <input
                                                        className="w-full bg-gray-800 text-gray-100 rounded-lg px-4 py-2.5 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                                        value={editing.firstName || ''}
                                                        onChange={(e) => setEditing({ ...editing, firstName: e.target.value })}
                                                        disabled={busy}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                                                    <input
                                                        className="w-full bg-gray-800 text-gray-100 rounded-lg px-4 py-2.5 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                                        value={editing.lastName || ''}
                                                        onChange={(e) => setEditing({ ...editing, lastName: e.target.value })}
                                                        disabled={busy}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                                    <input
                                                        className="w-full bg-gray-800 text-gray-100 rounded-lg px-4 py-2.5 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                                        value={editing.email || ''}
                                                        onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                                                        disabled={busy}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                                                    <select
                                                        className="w-full bg-gray-800 text-gray-100 rounded-lg px-4 py-2.5 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                                        value={editing.role || 'USER'}
                                                        onChange={(e) => setEditing({ ...editing, role: e.target.value as User['role'] })}
                                                        disabled={busy}
                                                    >
                                                        {Object.values(UserRole).map((role) => (
                                                            <option key={role} value={role as User['role']}>
                                                                {getEnumDisplayName(role as User['role'] || "USER")}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="lg:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">Profile Picture</label>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        accept="image/*"
                                                        onChange={handleImageSelect}
                                                        className="hidden"
                                                        disabled={busy}
                                                    />

                                                    <div className="flex items-center gap-4">
                                                        {/* Show preview if selected, otherwise show current avatar */}
                                                        {selectedImage ? (
                                                            <Image
                                                                src={selectedImage}
                                                                alt="Preview"
                                                                width={44}
                                                                height={44}
                                                                className="w-11 h-11 rounded-full object-cover border-2 border-gray-600"
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <UserAvatar
                                                                image={editing.image}
                                                                picture={editing.picture}
                                                                displayName={editing.displayName}
                                                                firstName={editing.firstName}
                                                                size="md"
                                                                border="thin"
                                                            />
                                                        )}

                                                        <div className="flex-1 flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => fileInputRef.current?.click()}
                                                                disabled={busy}
                                                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                                            >
                                                                {selectedImage ? 'Change Image' : 'Upload Image'}
                                                            </button>
                                                            {selectedImage && (
                                                                <button
                                                                    type="button"
                                                                    onClick={cancelImageSelection}
                                                                    disabled={busy}
                                                                    className="border border-gray-500 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-gray-700">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <button
                                                        onClick={handleUpdate}
                                                        disabled={busy}
                                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 text-sm rounded-lg font-medium transition-colors"
                                                    >
                                                        {busy ? 'Saving…' : 'Save Changes'}
                                                    </button>
                                                    {!showDeleteConfirm && (
                                                        <button
                                                            onClick={() => setShowDeleteConfirm(true)}
                                                            disabled={busy}
                                                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2.5 text-sm rounded-lg font-medium transition-colors"
                                                        >
                                                            Delete User
                                                        </button>
                                                    )}
                                                </div>
                                                {showDeleteConfirm && (
                                                    <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 text-sm">
                                                        <p className="text-red-300 mb-3">Are you sure you want to delete this user? This action cannot be undone.</p>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={handleDelete}
                                                                disabled={busy}
                                                                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-5 py-2.5 text-sm rounded-lg font-medium transition-colors"
                                                            >
                                                                {busy ? 'Deleting…' : 'Yes, Delete'}
                                                            </button>
                                                            <button
                                                                onClick={() => setShowDeleteConfirm(false)}
                                                                disabled={busy}
                                                                className="border border-gray-600 hover:bg-gray-700 text-gray-200 px-5 py-2.5 text-sm rounded-lg font-medium transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && results.length === 0 && !error && (
                        <div className="flex-1 flex items-center justify-center border border-gray-700 rounded-xl">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-semibold text-gray-100 mb-2">Search for Users</h3>
                                <p className="text-gray-400">Use the search bar above to find users to manage</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
