'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserAvatar from './UserAvatar';
import logo from '@/images/algobuddy-square-icon.png';
import Image from 'next/image';

export default function Header() {
    const { accessToken, logout } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/auth/login');
    };

    return (
        <header className="bg-gray-800 shadow-sm border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Title Section */}
                    <div className="flex items-center space-x-4">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                                <Image src={logo} alt="Algobuddy" />
                            </div>
                            <span className="text-xl font-bold text-gray-100">AlgoBuddy</span>
                        </Link>
                    </div>

                    {/* User Section */}
                    {accessToken && user ? (
                        <div className="flex items-center space-x-2">
                            {/* User Avatar and Info */}
                            <Link
                                href="/profile"
                                className="flex items-center cursor-pointer mr-3"
                                title="Profile"
                            >
                                <UserAvatar
                                    image={user.image}
                                    picture={user.picture}
                                    displayName={user.displayName}
                                    size="sm"
                                    className="hover:opacity-80 transition-opacity"
                                />
                            </Link>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="bg-gray-600 text-gray-200 p-2 rounded-md transition-colors cursor-pointer hover:bg-gray-500"
                                title="Logout"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </header >
    );
}