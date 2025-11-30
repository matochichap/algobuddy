'use client';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Question, Topic, Difficulty } from 'shared';
import { useState } from 'react';
import { getEnumDisplayName } from '@/utils/common';
import { get } from 'http';

export default function AdminQuestionsPage() {
  const { authFetch, refreshAccessToken } = useAuth();

  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Question | null>(null);
  const [editing, setEditing] = useState<Question | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    description: '',
    difficulty: Difficulty.EASY,
    topics: [] as Topic[]
  });

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
          setEditing(data[0]);
        } else {
          setSelected(null);
          setEditing(null);
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

  const handleUpdate = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      const { id, title, description, difficulty, topics } = editing;
      const res = await authFetch(`${process.env.NEXT_PUBLIC_QUESTION_SERVICE_BASE_URL}/api/question/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({ title, description, difficulty, topics })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Update failed');
      }
      const updated = await res.json();
      // Update in results list
      setResults(prev => prev.map(q => q.id === updated.id ? updated : q));
      setSelected(updated);
      setEditing(updated);
    } catch (err) {
      console.error(err);
      setError('Failed to update question');
    } finally {
      setBusy(false);
      refreshAccessToken();
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_QUESTION_SERVICE_BASE_URL}/api/question/${encodeURIComponent(selected.id)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Delete failed');
      }
      setResults(prev => prev.filter(q => q.id !== selected.id));
      setSelected(null);
      setEditing(null);
      setTitle('');
      setTopic('');
      setDifficulty('');
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error(err);
      setError('Failed to delete question');
    } finally {
      setBusy(false);
      refreshAccessToken();
    }
  };

  const handleCreate = async () => {
    if (!newQuestion.title || !newQuestion.description || newQuestion.topics.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await authFetch(`${process.env.NEXT_PUBLIC_QUESTION_SERVICE_BASE_URL}/api/question`, {
        method: 'POST',
        body: JSON.stringify({
          title: newQuestion.title,
          description: newQuestion.description,
          difficulty: newQuestion.difficulty,
          topics: newQuestion.topics
        })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Create failed');
      }
      const created = await res.json();
      setResults(prev => [created, ...prev]);
      setSelected(created);
      setEditing(created);
      setShowCreateForm(false);
      setNewQuestion({
        title: '',
        description: '',
        difficulty: Difficulty.EASY,
        topics: []
      });
    } catch (err) {
      console.error(err);
      setError('Failed to create question');
    } finally {
      setBusy(false);
      refreshAccessToken();
    }
  };

  const toggleTopicSelection = (topicValue: Topic, isNewQuestion = false) => {
    if (isNewQuestion) {
      setNewQuestion(prev => ({
        ...prev,
        topics: prev.topics.includes(topicValue)
          ? prev.topics.filter(t => t !== topicValue)
          : [...prev.topics, topicValue]
      }));
    } else if (editing) {
      setEditing({
        ...editing,
        topics: editing.topics.includes(topicValue)
          ? editing.topics.filter(t => t !== topicValue)
          : [...editing.topics, topicValue]
      });
    }
  };

  return (
    <>
      <Header />
      <div className="h-[calc(100vh-4rem)] bg-gray-900 py-6 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6 flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-100">Manage Questions</h1>
            <button
              onClick={() => {
                setShowCreateForm(true);
                setError(null);
              }}
              disabled={loading || busy}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Create Question
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex gap-3 mb-6 flex-shrink-0">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter question title"
              className="flex-1 bg-gray-100 text-black rounded-md px-3 py-2 border border-gray-500 focus:ring-blue-400 focus:border-blue-400 text-sm"
              disabled={loading || busy}
            />
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-gray-100 text-black rounded-md px-3 py-2 border border-gray-500 focus:ring-blue-400 focus:border-blue-400 text-sm"
              disabled={loading || busy}
            >
              <option value="">All Topics</option>
              {Object.values(Topic).map((value) => (
                <option key={value} value={value}>{getEnumDisplayName(value)}</option>
              ))}
            </select>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-gray-100 text-black rounded-md px-3 py-2 border border-gray-500 focus:ring-blue-400 focus:border-blue-400 text-sm"
              disabled={loading || busy}
            >
              <option value="">All Difficulties</option>
              {Object.values(Difficulty).map((value) => (
                <option key={value} value={value}>{getEnumDisplayName(value)}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={loading || busy}
              className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {error && (
            <div className="mb-6 bg-red-900 border border-red-700 rounded-md p-4 flex-shrink-0">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 flex-1 min-h-0 overflow-hidden h-full">
              <div className="xl:col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-5 flex flex-col overflow-hidden">
                <h3 className="text-md font-semibold text-gray-100 mb-4 flex-shrink-0">Results ({results.length})</h3>
                <ul className="divide-y divide-gray-700 overflow-y-auto flex-1">
                  {results.map(q => (
                    <li key={q.id} className={`py-4 cursor-pointer ${selected?.id === q.id ? 'bg-gray-700' : 'hover:bg-gray-700/60'} rounded-md px-3`}
                      onClick={() => { setSelected(q); setEditing(q); }}>
                      <div className="flex flex-col gap-2">
                        <div className="text-gray-100 font-medium">{q.title}</div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${q.difficulty === Difficulty.EASY ? 'bg-green-600/30 border-green-500 text-green-200' :
                            q.difficulty === Difficulty.MEDIUM ? 'bg-yellow-600/30 border-yellow-500 text-yellow-200' :
                              'bg-red-600/30 border-red-500 text-red-200'
                            }`}>
                            {getEnumDisplayName(q.difficulty)}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {q.topics.slice(0, 2).map(t => (
                              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-blue-600/30 border-blue-500 text-blue-200 border">
                                {getEnumDisplayName(t)}
                              </span>
                            ))}
                            {q.topics.length > 2 && (
                              <span className="text-xs text-gray-400">+{q.topics.length - 2}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {selected && editing && (
                <div className="xl:col-span-3 h-full min-h-0">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-gray-100 mb-4 flex-shrink-0">Edit Question</h2>

                    <div className="overflow-y-auto flex-1 space-y-4 min-h-0 max-h-full">
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Title</label>
                        <input
                          className="w-full bg-gray-100 text-black rounded-md px-3 py-2 border border-gray-500"
                          value={editing.title || ''}
                          onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                          disabled={busy}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Description</label>
                        <textarea
                          className="w-full bg-gray-100 text-black rounded-md px-3 py-2 border border-gray-500 min-h-[200px]"
                          value={editing.description || ''}
                          onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                          disabled={busy}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-1">Difficulty</label>
                        <select
                          className="w-full bg-gray-100 text-black rounded-md px-3 py-2 border border-gray-500"
                          value={editing.difficulty}
                          onChange={(e) => setEditing({ ...editing, difficulty: e.target.value.valueOf() as Difficulty })}
                          disabled={busy}
                        >
                          {Object.values(Difficulty).map((value) => (
                            <option key={value} value={value}>{getEnumDisplayName(value)}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">Topics</label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.values(Topic).map((value) => (
                            <label key={value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={editing.topics.includes(value)}
                                onChange={() => toggleTopicSelection(value)}
                                disabled={busy}
                                className="rounded border-gray-500"
                              />
                              <span className="text-sm text-gray-200">{getEnumDisplayName(value)}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <button
                            onClick={handleUpdate}
                            disabled={busy}
                            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                          >
                            {busy ? 'Saving…' : 'Save Changes'}
                          </button>
                          {!showDeleteConfirm && (
                            <button
                              onClick={() => setShowDeleteConfirm(true)}
                              disabled={busy}
                              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                              Delete Question
                            </button>
                          )}
                        </div>
                        {showDeleteConfirm && (
                          <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
                            <p className="text-red-300 mb-3 text-sm">Are you sure you want to delete this question? This action cannot be undone.</p>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={handleDelete}
                                disabled={busy}
                                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                              >
                                {busy ? 'Deleting…' : 'Yes, Delete'}
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={busy}
                                className="border border-gray-500 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
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

          {/* Create Question Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <h2 className="text-lg font-semibold text-gray-100 mb-4">Create New Question</h2>
                {error && (
                  <div className="mb-6 bg-red-900 border border-red-700 rounded-md p-4 flex-shrink-0">
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Title *</label>
                    <input
                      className="w-full bg-gray-100 text-black rounded-md px-3 py-2 border border-gray-500"
                      value={newQuestion.title}
                      onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                      disabled={busy}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Description *</label>
                    <textarea
                      className="w-full bg-gray-100 text-black rounded-md px-3 py-2 border border-gray-500 min-h-[200px]"
                      value={newQuestion.description}
                      onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                      disabled={busy}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Difficulty *</label>
                    <select
                      className="w-full bg-gray-100 text-black rounded-md px-3 py-2 border border-gray-500"
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value as Difficulty })}
                      disabled={busy}
                    >
                      {Object.values(Difficulty).map((value) => (
                        <option key={value} value={value}>{getEnumDisplayName(value)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Topics * (select at least one)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(Topic).map((value) => (
                        <label key={value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newQuestion.topics.includes(value as Topic)}
                            onChange={() => toggleTopicSelection(value as Topic, true)}
                            disabled={busy}
                            className="rounded border-gray-500"
                          />
                          <span className="text-sm text-gray-200">{getEnumDisplayName(value)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <button
                    onClick={handleCreate}
                    disabled={busy}
                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {busy ? 'Creating…' : 'Create Question'}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    disabled={busy}
                    className="border border-gray-500 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
