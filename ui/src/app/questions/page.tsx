'use client';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Question, Topic, Difficulty } from 'shared';
import { useState } from 'react';
import { getEnumDisplayName } from '@/utils/common';

export default function QuestionsPage() {
    const { authFetch } = useAuth();

    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<Question[]>([]);
    const [selected, setSelected] = useState<Question | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setResults([]);
        setSelected(null);

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (title.trim()) params.append('title', title.trim());
            if (topic) params.append('topic', topic);
            if (difficulty) params.append('difficulty', difficulty);

            const res = await authFetch(`${process.env.NEXT_PUBLIC_QUESTION_SERVICE_BASE_URL}/api/question?${params.toString()}`);
            if (res.ok) {
                const data: Question[] = await res.json();
                setResults(data);
                if (data.length > 0) {
                    setSelected(data[0]);
                } else {
                    setSelected(null);
                    setError('No questions found');
                }
            } else {
                const text = await res.text();
                setError(text || 'Failed to fetch questions');
            }
        } catch (err) {
            setError('Failed to fetch questions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (diff: Difficulty) => {
        switch (diff) {
            case Difficulty.EASY:
                return 'bg-green-600/20 border-green-500 text-green-300';
            case Difficulty.MEDIUM:
                return 'bg-yellow-600/20 border-yellow-500 text-yellow-300';
            case Difficulty.HARD:
                return 'bg-red-600/20 border-red-500 text-red-300';
            default:
                return 'bg-gray-600/20 border-gray-500 text-gray-300';
        }
    };

    return (
        <>
            <Header />
            <div className="h-[calc(100vh-4rem)] bg-gray-900 py-6 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-full flex flex-col">
                    <h1 className="text-2xl font-bold text-gray-100 mb-6 flex-shrink-0">Browse Questions</h1>

                    <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6 flex-shrink-0">
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Search by title..."
                            className="flex-1 min-w-[200px] bg-gray-800 text-gray-100 rounded-lg px-4 py-2.5 border border-gray-600 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                            disabled={loading}
                        />
                        <select
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="bg-gray-800 text-gray-100 rounded-lg px-4 py-2.5 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                            disabled={loading}
                        >
                            <option value="">All Topics</option>
                            {Object.values(Topic).map((value) => (
                                <option key={value} value={value}>{getEnumDisplayName(value)}</option>
                            ))}
                        </select>
                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="bg-gray-800 text-gray-100 rounded-lg px-4 py-2.5 border border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                            disabled={loading}
                        >
                            <option value="">All Difficulties</option>
                            {Object.values(Difficulty).map((value) => (
                                <option key={value} value={value}>{getEnumDisplayName(value)}</option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
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
                        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 flex-1 min-h-0 overflow-hidden h-full">
                            {/* Questions List */}
                            <div className="xl:col-span-2 bg-gray-800/50 border border-gray-700 rounded-xl p-5 flex flex-col overflow-hidden">
                                <h3 className="text-lg font-semibold text-gray-100 mb-4 flex-shrink-0">
                                    {results.length} Question{results.length !== 1 ? 's' : ''} Found
                                </h3>
                                <ul className="space-y-3 overflow-y-auto flex-1 pr-2">
                                    {results.map(q => (
                                        <li
                                            key={q.id}
                                            className={`p-4 rounded-lg cursor-pointer transition-all ${selected?.id === q.id
                                                ? 'bg-blue-600/20 border-2 border-blue-500'
                                                : 'bg-gray-800 border border-gray-700 hover:border-gray-500 hover:bg-gray-750'
                                                }`}
                                            onClick={() => setSelected(q)}
                                        >
                                            <div className="flex flex-col gap-3">
                                                <h4 className="text-gray-100 font-medium leading-tight">{q.title}</h4>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getDifficultyColor(q.difficulty)}`}>
                                                        {getEnumDisplayName(q.difficulty)}
                                                    </span>
                                                    {q.topics.slice(0, 3).map(t => (
                                                        <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-blue-600/20 border border-blue-500/50 text-blue-300">
                                                            {getEnumDisplayName(t)}
                                                        </span>
                                                    ))}
                                                    {q.topics.length > 3 && (
                                                        <span className="text-xs text-gray-400">+{q.topics.length - 3} more</span>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Question Details */}
                            {selected && (
                                <div className="xl:col-span-3 h-full min-h-0">
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 flex flex-col h-full">
                                        {/* Question Header */}
                                        <div className="flex-shrink-0 mb-6">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <h2 className="text-2xl font-bold text-gray-100">{selected.title}</h2>
                                                <span className={`text-sm px-3 py-1.5 rounded-full border font-semibold whitespace-nowrap ${getDifficultyColor(selected.difficulty)}`}>
                                                    {getEnumDisplayName(selected.difficulty)}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {selected.topics.map(t => (
                                                    <span key={t} className="text-sm px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/50 text-blue-300">
                                                        {getEnumDisplayName(t)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Question Description */}
                                        <div className="overflow-y-auto flex-1 min-h-0">
                                            <div className="prose prose-invert max-w-none">
                                                <h3 className="text-lg font-semibold text-gray-200 mb-3">Description</h3>
                                                <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                                                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                        {selected.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && results.length === 0 && !error && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-semibold text-gray-100 mb-2">Search for Questions</h3>
                                <p className="text-gray-400">Use the filters above to find coding challenges</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
