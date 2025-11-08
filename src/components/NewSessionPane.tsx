import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Globe, Lock, Tag, Loader2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { SessionRequestWithDetails } from '../types/request';

interface NewSessionPaneProps {
  onClose: () => void;
  onSave: () => void;
  fromRequest?: SessionRequestWithDetails;
}

interface TagOption {
  id: string;
  name: string;
  color: string;
}

interface UserOption {
  id: string;
  full_name: string;
  email: string;
}

export default function NewSessionPane({ onClose, onSave, fromRequest }: NewSessionPaneProps) {
  const [title, setTitle] = useState(fromRequest?.title || '');
  const [description, setDescription] = useState(fromRequest?.description || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>(fromRequest?.visibility as 'public' | 'private' || 'public');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTags();
    fetchUsers();
    if (fromRequest?.datetime) {
      const dt = new Date(fromRequest.datetime);
      setDate(dt.toISOString().split('T')[0]);
      setTime(dt.toTimeString().slice(0, 5));
    }
  }, [fromRequest]);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableTags(data || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: newTagName.trim() })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setAvailableTags([...availableTags, data]);
        setSelectedTags([...selectedTags, data.id]);
        setNewTagName('');
      }
    } catch (err) {
      console.error('Error creating tag:', err);
      setError('Failed to create tag');
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleGuest = (userId: string) => {
    setSelectedGuests(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !date || !time) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const datetime = new Date(`${date}T${time}`);

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          title: title.trim(),
          description: description.trim(),
          datetime: datetime.toISOString(),
          visibility,
          created_by: user.id,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      if (selectedTags.length > 0 && session) {
        const sessionTagsData = selectedTags.map(tagId => ({
          session_id: session.id,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from('session_tags')
          .insert(sessionTagsData);

        if (tagsError) throw tagsError;
      }

      if (visibility === 'private' && selectedGuests.length > 0 && session) {
        const sessionGuestsData = selectedGuests.map(userId => ({
          session_id: session.id,
          user_id: userId,
        }));

        const { error: guestsError } = await supabase
          .from('session_guests')
          .insert(sessionGuestsData);

        if (guestsError) throw guestsError;
      }

      if (fromRequest && session) {
        const { error: updateError } = await supabase
          .from('session_requests')
          .update({ session_id: session.id })
          .eq('id', fromRequest.id);

        if (updateError) console.error('Error linking session to request:', updateError);
      }

      onSave();
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
        onClick={onClose}
      />
      <div className="fixed top-0 bottom-0 right-0 w-full max-w-3xl bg-white shadow-2xl z-[70] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#AFB6D2]/20">
          <h2 className="text-xl font-semibold text-[#1A2633]">
            {fromRequest ? 'Create Session from Request' : 'Create New Session'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#AFB6D2]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1A2633] mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent"
                placeholder="Session title"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2633] mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent resize-none"
                placeholder="Describe what the session will cover..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#1A2633] mb-2">
                  <Calendar className="w-4 h-4 text-[#27A4F6]" />
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#1A2633] mb-2">
                  <Clock className="w-4 h-4 text-[#27A4F6]" />
                  Time *
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2633] mb-3">
                Visibility
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                    visibility === 'public'
                      ? 'border-[#27A4F6] bg-[#27A4F6]/5 text-[#27A4F6]'
                      : 'border-[#AFB6D2]/30 text-[#AFB6D2] hover:border-[#AFB6D2]/50'
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  <span className="font-medium">Public</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                    visibility === 'private'
                      ? 'border-[#F06429] bg-[#F06429]/5 text-[#F06429]'
                      : 'border-[#AFB6D2]/30 text-[#AFB6D2] hover:border-[#AFB6D2]/50'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span className="font-medium">Private</span>
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[#1A2633] mb-3">
                <Tag className="w-4 h-4 text-[#27A4F6]" />
                Tags
              </label>

              <div className="flex flex-wrap gap-2 mb-3">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      selectedTags.includes(tag.id)
                        ? 'bg-[#27A4F6] text-white'
                        : 'bg-[#AFB6D2]/10 text-[#AFB6D2] hover:bg-[#AFB6D2]/20'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent"
                  placeholder="Create new tag..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-[#27A4F6] text-white rounded-lg hover:bg-[#27A4F6]/90 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {visibility === 'private' && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#1A2633] mb-3">
                  <Users className="w-4 h-4 text-[#F06429]" />
                  Guest List
                </label>
                <p className="text-sm text-[#AFB6D2] mb-3">
                  Select users who can view this private session
                </p>

                <div className="max-h-64 overflow-y-auto border border-[#AFB6D2]/30 rounded-lg p-3 space-y-2">
                  {availableUsers.length === 0 ? (
                    <p className="text-sm text-[#AFB6D2] text-center py-4">No users available</p>
                  ) : (
                    availableUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 p-2 hover:bg-[#F6F8FC] rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGuests.includes(user.id)}
                          onChange={() => toggleGuest(user.id)}
                          className="w-4 h-4 text-[#F06429] border-[#AFB6D2]/30 rounded focus:ring-[#F06429]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A2633] truncate">
                            {user.full_name || 'Unnamed User'}
                          </p>
                          <p className="text-xs text-[#AFB6D2] truncate">{user.email}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                {selectedGuests.length > 0 && (
                  <p className="text-sm text-[#AFB6D2] mt-2">
                    {selectedGuests.length} guest{selectedGuests.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 bg-[#F06429]/10 border border-[#F06429]/20 rounded-lg">
                <p className="text-sm text-[#F06429]">{error}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-[#AFB6D2]/20 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#AFB6D2]/30 text-[#AFB6D2] rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#27A4F6] text-white rounded-lg hover:bg-[#27A4F6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Session</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
