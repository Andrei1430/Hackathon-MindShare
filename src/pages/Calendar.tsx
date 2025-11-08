import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { SessionWithDetails } from '../types/session';
import NewSessionPane from '../components/NewSessionPane';
import OutlookCalendarModal from '../components/OutlookCalendarModal';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function Calendar() {
  const { profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<SessionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSessionPane, setShowNewSessionPane] = useState(false);
  const [selectedSessionForOutlook, setSelectedSessionForOutlook] = useState<SessionWithDetails | null>(null);

  const canManageSessions = profile?.role === 'admin' || profile?.role === 'planner';

  useEffect(() => {
    fetchWeekSessions();
  }, [currentDate, profile]);

  const getWeekBounds = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setHours(0, 0, 0, 0);

    return { startOfWeek, endOfWeek };
  };

  const fetchWeekSessions = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const { startOfWeek, endOfWeek } = getWeekBounds(currentDate);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          *,
          profiles:created_by (full_name)
        `)
        .gte('datetime', startOfWeek.toISOString())
        .lt('datetime', endOfWeek.toISOString())
        .order('datetime', { ascending: true });

      if (sessionsError) throw sessionsError;

      const sessionsWithDetails = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { data: tagData } = await supabase
            .from('session_tags')
            .select('tags (*)')
            .eq('session_id', session.id);

          const { data: guestData } = await supabase
            .from('session_guests')
            .select('user_id')
            .eq('session_id', session.id);

          const isGuest = guestData?.some((g: any) => g.user_id === profile.id) || false;
          const canView =
            canManageSessions ||
            session.visibility === 'public' ||
            session.created_by === profile.id ||
            isGuest;

          const { data: interestData } = await supabase
            .from('session_interests')
            .select('id')
            .eq('session_id', session.id)
            .eq('user_id', profile.id)
            .maybeSingle();

          const isInterested = !!interestData;

          return {
            ...session,
            tags: tagData?.map((t: any) => t.tags) || [],
            creator_name: session.profiles?.full_name || 'Unknown',
            canView,
            isInterested
          };
        })
      );

      const filteredSessions = sessionsWithDetails.filter(s => s.canView);
      setSessions(filteredSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getWeekDates = () => {
    const { startOfWeek } = getWeekBounds(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const getSessionsForDay = (date: Date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.datetime);
      return (
        sessionDate.getFullYear() === date.getFullYear() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getDate() === date.getDate()
      );
    });
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWeekRange = () => {
    const { startOfWeek, endOfWeek } = getWeekBounds(currentDate);
    const end = new Date(endOfWeek);
    end.setDate(end.getDate() - 1);

    const startStr = startOfWeek.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const endStr = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `${startStr} - ${endStr}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const weekDates = getWeekDates();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#27A4F6]/30 border-t-[#27A4F6] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#AFB6D2]">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A2633]">Calendar</h1>
          <p className="text-[#AFB6D2] mt-1">Week view of all sessions</p>
        </div>
        {canManageSessions && (
          <button
            onClick={() => setShowNewSessionPane(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#27A4F6] to-[#27A4F6]/80 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Create Session</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#AFB6D2]/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-[#F6F8FC] rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#1A2633]" />
          </button>

          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-[#1A2633]">
              {formatWeekRange()}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm text-[#27A4F6] hover:bg-[#27A4F6]/10 rounded-lg transition-colors font-medium"
            >
              Today
            </button>
          </div>

          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-[#F6F8FC] rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-[#1A2633]" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const daySessions = getSessionsForDay(date);
            const isTodayDate = isToday(date);

            return (
              <div
                key={index}
                className={`min-h-[200px] border rounded-lg p-3 ${
                  isTodayDate
                    ? 'bg-[#27A4F6]/5 border-[#27A4F6]'
                    : 'bg-white border-[#AFB6D2]/20'
                }`}
              >
                <div className="text-center mb-3">
                  <div className={`text-xs font-medium uppercase ${
                    isTodayDate ? 'text-[#27A4F6]' : 'text-[#AFB6D2]'
                  }`}>
                    {DAYS[date.getDay()].slice(0, 3)}
                  </div>
                  <div className={`text-lg font-bold ${
                    isTodayDate ? 'text-[#27A4F6]' : 'text-[#1A2633]'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>

                <div className="space-y-2">
                  {daySessions.length === 0 ? (
                    <p className="text-xs text-[#AFB6D2] text-center italic mt-4">
                      No sessions
                    </p>
                  ) : (
                    daySessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSessionForOutlook(session)}
                        className={`p-2 rounded-lg text-xs transition-all hover:shadow-md cursor-pointer relative ${
                          session.visibility === 'private'
                            ? 'bg-[#F06429]/10 border border-[#F06429]/30'
                            : 'bg-[#27A4F6]/10 border border-[#27A4F6]/30'
                        } ${
                          session.isInterested ? 'ring-2 ring-[#F43F5E]' : ''
                        }`}
                      >
                        {session.isInterested && (
                          <div className="absolute top-1 right-1">
                            <Heart className="w-3 h-3 fill-[#F43F5E] text-[#F43F5E]" />
                          </div>
                        )}
                        <div className={`font-semibold mb-1 ${
                          session.visibility === 'private'
                            ? 'text-[#F06429]'
                            : 'text-[#27A4F6]'
                        }`}>
                          {formatTime(session.datetime)}
                        </div>
                        <div className="text-[#1A2633] font-medium line-clamp-2 mb-1">
                          {session.title}
                        </div>
                        {session.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {session.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag.id}
                                className="px-1.5 py-0.5 text-[10px] font-medium rounded text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                            {session.tags.length > 2 && (
                              <span className="text-[10px] text-[#AFB6D2]">
                                +{session.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showNewSessionPane && (
        <NewSessionPane
          onClose={() => setShowNewSessionPane(false)}
          onSave={() => {
            setShowNewSessionPane(false);
            fetchWeekSessions();
          }}
        />
      )}

      {selectedSessionForOutlook && (
        <OutlookCalendarModal
          session={selectedSessionForOutlook}
          onClose={() => setSelectedSessionForOutlook(null)}
        />
      )}
    </div>
  );
}
