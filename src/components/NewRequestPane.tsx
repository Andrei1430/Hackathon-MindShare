import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SuggestionCard from './SuggestionCard';

interface NewRequestPaneProps {
  onClose: () => void;
  onSave: () => void;
}

interface TopicSuggestion {
  title: string;
  description: string;
  tags: string[];
}

export default function NewRequestPane({ onClose, onSave }: NewRequestPaneProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [datetime, setDatetime] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const generateSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      setError('');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-topics`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError('Failed to generate suggestions. Please try again.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: TopicSuggestion) => {
    setTitle(suggestion.title);
    setDescription(suggestion.description);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !datetime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: insertError } = await supabase
        .from('session_requests')
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            datetime: datetime,
            visibility: visibility,
            status: 'pending',
            user_id: user!.id,
          },
        ]);

      if (insertError) throw insertError;

      onSave();
    } catch (err) {
      console.error('Error creating request:', err);
      setError('Failed to create request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#AFB6D2]/20">
          <h2 className="text-xl font-semibold text-[#1A2633]">New Session Request</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#AFB6D2]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-[#AFB6D2]/20">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#27A4F6]/10 rounded-full mb-3">
                  <Sparkles className="w-6 h-6 text-[#27A4F6]" />
                </div>
                <h3 className="text-base font-semibold text-[#1A2633] mb-1">
                  Need Inspiration?
                </h3>
                <p className="text-sm text-[#AFB6D2]">
                  Get AI-powered suggestions for session topics
                </p>
              </div>
              <button
                onClick={generateSuggestions}
                disabled={loadingSuggestions}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#27A4F6] text-white rounded-lg hover:bg-[#27A4F6]/90 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loadingSuggestions ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating Ideas...</span>
                  </>
                ) : (
                  <span>Generate Topic Suggestions</span>
                )}
              </button>
            </div>

            {suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#1A2633]">Suggested Topics</h3>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <SuggestionCard
                      key={index}
                      suggestion={suggestion}
                      onSelect={() => handleSelectSuggestion(suggestion)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#1A2633] mb-2">
                Title <span className="text-[#F06429]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent"
                placeholder="Enter session title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2633] mb-2">
                Description <span className="text-[#F06429]">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent resize-none"
                placeholder="Describe what you'd like to learn or discuss..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2633] mb-2">
                Preferred Date & Time <span className="text-[#F06429]">*</span>
              </label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="w-full px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2633] mb-2">
                Visibility
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                    className="w-4 h-4 text-[#27A4F6] focus:ring-[#27A4F6]"
                  />
                  <span className="text-sm text-[#1A2633]">Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                    className="w-4 h-4 text-[#27A4F6] focus:ring-[#27A4F6]"
                  />
                  <span className="text-sm text-[#1A2633]">Private</span>
                </label>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[#F06429]/10 border border-[#F06429]/20 rounded-lg">
                <p className="text-sm text-[#F06429]">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#AFB6D2]/20 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 border border-[#AFB6D2]/30 text-[#1A2633] rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !description.trim() || !datetime}
            className="flex-1 px-4 py-2 bg-[#27A4F6] text-white rounded-lg hover:bg-[#27A4F6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creating...' : 'Create Request'}
          </button>
        </div>
      </div>
    </>
  );
}
