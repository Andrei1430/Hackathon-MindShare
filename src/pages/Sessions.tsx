import { useState, useEffect } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SessionCard from '../components/SessionCard';
import NewSessionPane from '../components/NewSessionPane';
import type { SessionWithDetails, Tag } from '../types/session';

interface SessionsProps {
  onSessionClick?: (sessionId: string) => void;
}

export default function Sessions({ onSessionClick }: SessionsProps) {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithDetails[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'own'>('all');
  const [showNewSessionPane, setShowNewSessionPane] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchTags();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchQuery, selectedTag, timeFilter, ownerFilter]);

  const fetchSessions = async () => {
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          profiles:created_by (full_name)
        `)
        .order('datetime', { ascending: false });

      if (sessionsError) throw sessionsError;

      const isAdmin = profile?.role === 'admin';
      const isPlanner = profile?.role === 'planner';
      const canManageSessions = isAdmin || isPlanner;

      const sessionsWithTags = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { data: tagData } = await supabase
            .from('session_tags')
            .select('tags (*)')
            .eq('session_id', session.id);

          const { data: guestData } = await supabase
            .from('session_guests')
            .select('user_id')
            .eq('session_id', session.id);

          const isGuest = guestData?.some((g: any) => g.user_id === profile?.id) || false;
          const canView =
            canManageSessions ||
            session.visibility === 'public' ||
            session.created_by === profile?.id ||
            isGuest;

          return {
            ...session,
            tags: tagData?.map((t: any) => t.tags) || [],
            creator_name: session.profiles?.full_name || 'Unknown',
            canView
          };
        })
      );

      const visibleSessions = sessionsWithTags.filter(s => s.canView);
      setSessions(visibleSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const filterSessions = () => {
    let filtered = [...sessions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (session) =>
          session.title.toLowerCase().includes(query) ||
          session.description.toLowerCase().includes(query)
      );
    }

    if (selectedTag) {
      filtered = filtered.filter((session) =>
        session.tags.some((tag) => tag.id === selectedTag)
      );
    }

    const now = new Date();
    if (timeFilter === 'upcoming') {
      filtered = filtered.filter((session) => new Date(session.datetime) > now);
    } else if (timeFilter === 'past') {
      filtered = filtered.filter((session) => new Date(session.datetime) <= now);
    }

    if (ownerFilter === 'own' && profile) {
      filtered = filtered.filter((session) => session.created_by === profile.id);
    }

    setFilteredSessions(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#27A4F6]/30 border-t-[#27A4F6] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#AFB6D2]">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A2633]">Sessions</h1>
          <p className="text-[#AFB6D2] mt-1">
            Explore knowledge sharing sessions
          </p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'planner') && (
          <button
            onClick={() => setShowNewSessionPane(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#27A4F6] to-[#27A4F6]/80 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            <Calendar className="w-5 h-5" />
            <span>Create Session</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#AFB6D2]/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-[#27A4F6]" />
          <h2 className="text-lg font-semibold text-[#1A2633]">Filters</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#AFB6D2]" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent"
              />
            </div>

            <select
              value={selectedTag || ''}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent text-[#1A2633]"
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>

            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as 'all' | 'upcoming' | 'past')}
              className="px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent text-[#1A2633]"
            >
              <option value="all">All Sessions</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOwnerFilter(ownerFilter === 'own' ? 'all' : 'own')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                ownerFilter === 'own'
                  ? 'bg-[#27A4F6] text-white shadow-md'
                  : 'bg-[#AFB6D2]/10 text-[#1A2633] hover:bg-[#AFB6D2]/20'
              }`}
            >
              My Sessions
            </button>
          </div>
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#AFB6D2]/20">
          <Calendar className="w-16 h-16 text-[#AFB6D2] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[#1A2633] mb-2">
            No sessions found
          </h3>
          <p className="text-[#AFB6D2]">
            Try adjusting your filters or create a new session
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#AFB6D2]">
              Showing {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={fetchSessions}
                onClick={() => onSessionClick?.(session.id)}
              />
            ))}
          </div>
        </>
      )}

      {showNewSessionPane && (
        <NewSessionPane
          onClose={() => setShowNewSessionPane(false)}
          onSave={() => {
            setShowNewSessionPane(false);
            fetchSessions();
          }}
        />
      )}
    </div>
  );
}
