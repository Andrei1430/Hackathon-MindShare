import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, Globe, Lock, ExternalLink, Save, X, MessageSquare, Edit2, Trash2, Send, Heart, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { SessionWithDetails, Tag } from '../types/session';

interface Comment {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_name: string;
}

interface InterestedUser {
  id: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

interface UserOption {
  id: string;
  full_name: string;
  email: string;
}

interface Guest {
  user_id: string;
  user_name: string;
}

interface SessionDetailProps {
  sessionId: string;
  onClose: () => void;
}

export default function SessionDetail({ sessionId, onClose }: SessionDetailProps) {
  const { profile } = useAuth();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [interestedUsers, setInterestedUsers] = useState<InterestedUser[]>([]);
  const [isInterested, setIsInterested] = useState(false);
  const [togglingInterest, setTogglingInterest] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [sessionGuests, setSessionGuests] = useState<Guest[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    datetime: '',
    presentation_url: '',
    recording_url: '',
    visibility: 'public' as 'public' | 'private',
    selectedTags: [] as string[],
    selectedGuests: [] as string[]
  });

  const isAdmin = profile?.role === 'admin';
  const isPlanner = profile?.role === 'planner' || isAdmin;
  const isCreator = session?.created_by === profile?.id;
  const canEdit = isAdmin || isPlanner || isCreator;

  const sessionDate = session ? new Date(session.datetime) : null;
  const isFutureSession = sessionDate ? sessionDate > new Date() : false;

  useEffect(() => {
    fetchSession();
    fetchAllTags();
    fetchComments();
    fetchInterests();
    fetchUsers();
    fetchGuests();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          profiles:created_by (full_name)
        `)
        .eq('id', sessionId)
        .maybeSingle();

      if (sessionError) throw sessionError;
      if (!sessionData) {
        throw new Error('Session not found');
      }

      const { data: tagData } = await supabase
        .from('session_tags')
        .select('tags (*)')
        .eq('session_id', sessionId);

      const tags = tagData?.map((t: any) => t.tags) || [];
      const sessionWithDetails = {
        ...sessionData,
        tags,
        creator_name: sessionData.profiles?.full_name || 'Unknown'
      };

      setSession(sessionWithDetails);

      const { data: guestData } = await supabase
        .from('session_guests')
        .select('user_id')
        .eq('session_id', sessionId);

      const guestIds = guestData?.map((g: any) => g.user_id) || [];

      setFormData({
        title: sessionData.title,
        description: sessionData.description,
        datetime: sessionData.datetime,
        presentation_url: sessionData.presentation_url || '',
        recording_url: sessionData.recording_url || '',
        visibility: sessionData.visibility,
        selectedTags: tags.map((t: Tag) => t.id),
        selectedGuests: guestIds
      });
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setAllTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
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
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchGuests = async () => {
    try {
      const { data, error } = await supabase
        .from('session_guests')
        .select(`
          user_id,
          profiles:user_id (full_name)
        `)
        .eq('session_id', sessionId);

      if (error) throw error;

      const guests = data?.map((guest: any) => ({
        user_id: guest.user_id,
        user_name: guest.profiles?.full_name || 'Unknown User'
      })) || [];

      setSessionGuests(guests);
    } catch (error) {
      console.error('Error fetching guests:', error);
    }
  };

  const handleSave = async () => {
    if (!session || !canEdit) return;

    try {
      setSaving(true);

      const updateData: any = {
        visibility: formData.visibility,
        presentation_url: formData.presentation_url || null,
        recording_url: formData.recording_url || null,
        description: formData.description
      };

      if (isFutureSession) {
        updateData.title = formData.title;
        updateData.datetime = formData.datetime;
      }

      const { error: updateError } = await supabase
        .from('sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (updateError) throw updateError;

      const { error: deleteTagsError } = await supabase
        .from('session_tags')
        .delete()
        .eq('session_id', sessionId);

      if (deleteTagsError) throw deleteTagsError;

      if (formData.selectedTags.length > 0) {
        const tagInserts = formData.selectedTags.map(tagId => ({
          session_id: sessionId,
          tag_id: tagId
        }));

        const { error: insertTagsError } = await supabase
          .from('session_tags')
          .insert(tagInserts);

        if (insertTagsError) throw insertTagsError;
      }

      const { error: deleteGuestsError } = await supabase
        .from('session_guests')
        .delete()
        .eq('session_id', sessionId);

      if (deleteGuestsError) throw deleteGuestsError;

      if (formData.visibility === 'private' && formData.selectedGuests.length > 0) {
        const guestInserts = formData.selectedGuests.map(userId => ({
          session_id: sessionId,
          user_id: userId
        }));

        const { error: insertGuestsError } = await supabase
          .from('session_guests')
          .insert(guestInserts);

        if (insertGuestsError) throw insertGuestsError;
      }

      await fetchSession();
      await fetchGuests();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Failed to save session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId]
    }));
  };

  const handleGuestToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedGuests: prev.selectedGuests.includes(userId)
        ? prev.selectedGuests.filter(id => id !== userId)
        : [...prev.selectedGuests, userId]
    }));
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('session_comments')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const commentsWithNames = data?.map((comment: any) => ({
        ...comment,
        user_name: comment.profiles?.full_name || 'Unknown User'
      })) || [];

      setComments(commentsWithNames);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !profile?.id) return;

    try {
      setSubmittingComment(true);
      const { error } = await supabase
        .from('session_comments')
        .insert({
          session_id: sessionId,
          user_id: profile.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingCommentContent.trim()) return;

    try {
      const { error } = await supabase
        .from('session_comments')
        .update({ content: editingCommentContent.trim() })
        .eq('id', commentId);

      if (error) throw error;

      setEditingCommentId(null);
      setEditingCommentContent('');
      await fetchComments();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('session_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      await fetchComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const startEditingComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const fetchInterests = async () => {
    try {
      const { data, error } = await supabase
        .from('session_interests')
        .select(`
          id,
          user_id,
          created_at,
          profiles:user_id (full_name)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const interests = data?.map((interest: any) => ({
        id: interest.id,
        user_id: interest.user_id,
        user_name: interest.profiles?.full_name || 'Unknown User',
        created_at: interest.created_at
      })) || [];

      setInterestedUsers(interests);
      setIsInterested(interests.some((i: InterestedUser) => i.user_id === profile?.id));
    } catch (error) {
      console.error('Error fetching interests:', error);
    }
  };

  const toggleInterest = async () => {
    if (!profile?.id || togglingInterest) return;

    try {
      setTogglingInterest(true);

      if (isInterested) {
        const { error } = await supabase
          .from('session_interests')
          .delete()
          .eq('session_id', sessionId)
          .eq('user_id', profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('session_interests')
          .insert({
            session_id: sessionId,
            user_id: profile.id
          });

        if (error) throw error;
      }

      await fetchInterests();
    } catch (error) {
      console.error('Error toggling interest:', error);
      alert('Failed to update interest. Please try again.');
    } finally {
      setTogglingInterest(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8">
          <div className="w-16 h-16 border-4 border-[#27A4F6]/30 border-t-[#27A4F6] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#AFB6D2]">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-[#1A2633] mb-4">Session Not Found</h2>
          <p className="text-[#AFB6D2] mb-6">The session you're looking for doesn't exist.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#27A4F6] text-white rounded-lg hover:shadow-lg transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen p-4 flex items-start justify-center">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full my-8">
          <div className="sticky top-0 bg-white border-b border-[#AFB6D2]/20 p-6 rounded-t-xl flex items-center justify-between z-10">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-[#AFB6D2] hover:text-[#1A2633] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-[#27A4F6] text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                Edit Session
              </button>
            )}
            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      title: session.title,
                      description: session.description,
                      datetime: session.datetime,
                      presentation_url: session.presentation_url || '',
                      recording_url: session.recording_url || '',
                      visibility: session.visibility,
                      selectedTags: session.tags.map(t => t.id)
                    });
                  }}
                  className="px-4 py-2 bg-[#AFB6D2]/20 text-[#1A2633] rounded-lg hover:bg-[#AFB6D2]/30 transition-all font-medium"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#27A4F6] text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-[#AFB6D2]/20">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleInterest}
                  disabled={togglingInterest}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isInterested
                      ? 'bg-[#F06429] text-white hover:shadow-lg'
                      : 'bg-[#AFB6D2]/10 text-[#1A2633] hover:bg-[#AFB6D2]/20'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isInterested ? 'fill-current' : ''}`} />
                  {isInterested ? 'Interested' : 'Show Interest'}
                </button>

                {interestedUsers.length > 0 && (
                  <div className="flex items-center gap-2 text-[#AFB6D2]">
                    <Users className="w-5 h-5" />
                    <span className="text-sm">
                      <span className="font-semibold text-[#1A2633]">{interestedUsers.length}</span>
                      {' '}interested
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#AFB6D2] mb-2">
                Title
              </label>
              {isEditing && isFutureSession ? (
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent text-lg font-semibold"
                />
              ) : (
                <h1 className="text-3xl font-bold text-[#1A2633]">{session.title}</h1>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-[#AFB6D2]">
                <Calendar className="w-5 h-5" />
                {isEditing && isFutureSession ? (
                  <input
                    type="datetime-local"
                    value={formData.datetime.slice(0, 16)}
                    onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                    className="px-3 py-1 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6]"
                  />
                ) : (
                  <span>{new Date(session.datetime).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[#AFB6D2]">
                <Clock className="w-5 h-5" />
                <span>
                  {new Date(session.datetime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'private' })}
                    className="px-3 py-1 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6]"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                ) : (
                  <>
                    {session.visibility === 'public' ? (
                      <>
                        <Globe className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 text-[#F06429]" />
                        <span className="text-sm font-medium text-[#F06429]">Private</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#AFB6D2] mb-2">
                Created by
              </label>
              <p className="text-[#1A2633] font-medium">{session.creator_name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#AFB6D2] mb-2">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent resize-none"
                />
              ) : (
                <p className="text-[#1A2633] leading-relaxed whitespace-pre-wrap">
                  {session.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#AFB6D2] mb-2">
                Tags
              </label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        formData.selectedTags.includes(tag.id)
                          ? 'bg-[#27A4F6] text-white'
                          : 'bg-[#AFB6D2]/20 text-[#1A2633] hover:bg-[#AFB6D2]/30'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {session.tags.length > 0 ? (
                    session.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-[#AFB6D2]">No tags assigned</p>
                  )}
                </div>
              )}
            </div>

            {formData.visibility === 'private' && isEditing && (
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
                          checked={formData.selectedGuests.includes(user.id)}
                          onChange={() => handleGuestToggle(user.id)}
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

                {formData.selectedGuests.length > 0 && (
                  <p className="text-sm text-[#AFB6D2] mt-2">
                    {formData.selectedGuests.length} guest{formData.selectedGuests.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            {session.visibility === 'private' && !isEditing && sessionGuests.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[#AFB6D2] mb-3">
                  Guest List
                </label>
                <div className="flex flex-wrap gap-2">
                  {sessionGuests.map((guest) => (
                    <div
                      key={guest.user_id}
                      className="flex items-center gap-2 px-3 py-2 bg-[#F06429]/10 text-[#1A2633] rounded-lg"
                    >
                      <Users className="w-4 h-4 text-[#F06429]" />
                      <span className="text-sm font-medium">{guest.user_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#AFB6D2] mb-2">
                  Presentation Link
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.presentation_url}
                    onChange={(e) => setFormData({ ...formData, presentation_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent"
                  />
                ) : session.presentation_url ? (
                  <a
                    href={session.presentation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#27A4F6] hover:underline"
                  >
                    <span className="truncate">View Presentation</span>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </a>
                ) : (
                  <p className="text-[#AFB6D2]">Not available</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#AFB6D2] mb-2">
                  Recording Link
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.recording_url}
                    onChange={(e) => setFormData({ ...formData, recording_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent"
                  />
                ) : session.recording_url ? (
                  <a
                    href={session.recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#27A4F6] hover:underline"
                  >
                    <span className="truncate">Watch Recording</span>
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  </a>
                ) : (
                  <p className="text-[#AFB6D2]">Not available</p>
                )}
              </div>
            </div>

            {!isFutureSession && isEditing && (
              <div className="bg-[#F06429]/10 border border-[#F06429]/20 rounded-lg p-4">
                <p className="text-sm text-[#F06429]">
                  This session has already occurred. Only visibility, presentation link, and recording link can be edited.
                </p>
              </div>
            )}

            {interestedUsers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-[#AFB6D2] mb-3">
                  Interested Users
                </label>
                <div className="flex flex-wrap gap-2">
                  {interestedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 px-3 py-2 bg-[#F06429]/10 text-[#1A2633] rounded-lg"
                    >
                      <Heart className="w-4 h-4 text-[#F06429] fill-current" />
                      <span className="text-sm font-medium">{user.user_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-[#AFB6D2]/20 pt-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-[#27A4F6]" />
                <h3 className="text-xl font-semibold text-[#1A2633]">
                  Discussion ({comments.length})
                </h3>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts about this session..."
                      rows={3}
                      className="w-full px-4 py-3 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent resize-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submittingComment}
                    className="flex items-center gap-2 px-4 py-2 bg-[#27A4F6] text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="text-center py-8 bg-[#AFB6D2]/5 rounded-lg">
                    <MessageSquare className="w-12 h-12 text-[#AFB6D2] mx-auto mb-3" />
                    <p className="text-[#AFB6D2]">No comments yet. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-[#AFB6D2]/5 rounded-lg p-4 hover:bg-[#AFB6D2]/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-[#1A2633]">{comment.user_name}</p>
                          <p className="text-xs text-[#AFB6D2]">
                            {new Date(comment.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {comment.created_at !== comment.updated_at && ' (edited)'}
                          </p>
                        </div>
                        {comment.user_id === profile?.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditingComment(comment)}
                              className="p-2 text-[#27A4F6] hover:bg-[#27A4F6]/10 rounded-lg transition-colors"
                              title="Edit comment"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-2 text-[#F06429] hover:bg-[#F06429]/10 rounded-lg transition-colors"
                              title="Delete comment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingCommentContent}
                            onChange={(e) => setEditingCommentContent(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent resize-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              className="px-3 py-1 bg-[#27A4F6] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditingComment}
                              className="px-3 py-1 bg-[#AFB6D2]/20 text-[#1A2633] rounded-lg hover:bg-[#AFB6D2]/30 transition-all text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[#1A2633] whitespace-pre-wrap">{comment.content}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
