'use client';
import Header from '@/components/Header';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { useMatch } from '@/contexts/MatchContext';
import { getRelativeTime, getMemberSince } from '@/utils/common';

export default function Home() {
  const { user } = useUser();
  const { matchedUser } = useMatch();

  const isAdmin = user?.role === 'ADMIN';
  const lastLogin = user?.lastLogin ? new Date(user.lastLogin) : null;
  const memberSince = user?.createdAt ? new Date(user.createdAt) : null;

  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-4rem)] bg-gray-900 flex items-center justify-center py-8 overflow-y-auto">
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section - Compact */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-100 mb-3">
              {user?.displayName ? `Welcome back, ${user.displayName}!` : "Welcome back!"}
            </h1>
            <div className="flex items-center justify-center gap-3 text-base text-gray-400">
              {lastLogin && (
                <span>Last login: {getRelativeTime(lastLogin)}</span>
              )}
              {lastLogin && memberSince && <span>•</span>}
              {memberSince && (
                <span>Member since {getMemberSince(memberSince)}</span>
              )}
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {matchedUser ? (
              <Link href="/collaboration" className="group">
                <div className="bg-gray-800 rounded-xl p-8 border border-green-500/50 hover:border-green-400 transition-all hover:bg-gray-750 h-full">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-gray-100 mb-3 group-hover:text-green-400 transition-colors">Join Room</h3>
                  <p className="text-gray-400">
                    Continue your session with {matchedUser.displayName || 'your matched peer'}.
                  </p>
                </div>
              </Link>
            ) : (
              <Link href="/matching" className="group">
                <div className="bg-gray-800 rounded-xl p-8 border border-blue-500/50 hover:border-blue-500 transition-all hover:bg-gray-750 h-full">
                  <div className="text-4xl mb-4">🤝</div>
                  <h3 className="text-xl font-semibold text-gray-100 mb-3 group-hover:text-blue-400 transition-colors">Find a Match</h3>
                  <p className="text-gray-400">
                    Connect with a peer and practice coding problems together in real-time.
                  </p>
                </div>
              </Link>
            )}

            <Link href="/profile" className="group">
              <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-blue-500 transition-all hover:bg-gray-750 h-full">
                <div className="text-4xl mb-4">👤</div>
                <h3 className="text-xl font-semibold text-gray-100 mb-3 group-hover:text-blue-400 transition-colors">Manage Profile</h3>
                <p className="text-gray-400">
                  Manage your account settings and personalize your experience.
                </p>
              </div>
            </Link>

            <Link href="/questions" className="group">
              <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-blue-500 transition-all hover:bg-gray-750 h-full">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-100 mb-3 group-hover:text-blue-400 transition-colors">Browse Questions</h3>
                <p className="text-gray-400">
                  Browse coding challenges ranging from easy to hard difficulty.
                </p>
              </div>
            </Link>
          </div>

          {/* Admin Panel - Only shown for admins */}
          {isAdmin && (
            <div className="bg-gray-800 rounded-xl p-8 border border-indigo-500/50">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">🔧</span>
                <h2 className="text-xl font-semibold text-gray-100">Admin Panel</h2>
                <span className="text-sm px-3 py-1 rounded-full bg-indigo-600/30 border border-indigo-500 text-indigo-200">
                  Admin
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/admin/users">
                  <button className="bg-gray-700 hover:bg-gray-600 text-gray-100 px-5 py-3 rounded-lg text-base font-medium transition-colors border border-gray-600 hover:border-gray-500 cursor-pointer">
                    👥 Manage Users
                  </button>
                </Link>
                <Link href="/admin/questions">
                  <button className="bg-gray-700 hover:bg-gray-600 text-gray-100 px-5 py-3 rounded-lg text-base font-medium transition-colors border border-gray-600 hover:border-gray-500 cursor-pointer">
                    📝 Manage Questions
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}