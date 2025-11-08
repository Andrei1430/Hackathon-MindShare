import { useEffect, useState } from 'react';
import { Calendar, Users, Clock, CheckCircle, TrendingUp, BookOpen, ExternalLink, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalSessions: number;
  upcomingSessions: number;
  totalUsers: number;
  mySessions: number;
  pendingRequests: number;
  completedSessions: number;
}

interface TechConference {
  title: string;
  date: string;
  tags: string[];
  link: string;
  description: string;
  speakers?: string[];
}

export default function Home() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    upcomingSessions: 0,
    totalUsers: 0,
    mySessions: 0,
    pendingRequests: 0,
    completedSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [conferences, setConferences] = useState<TechConference[]>([]);
  const [conferencesLoading, setConferencesLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';
  const isPlanner = profile?.role === 'planner' || isAdmin;

  useEffect(() => {
    fetchStats();
    fetchConferences();
  }, [profile]);

  const fetchConferences = async () => {
    try {
      setConferencesLoading(true);
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-tech-conferences`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conferences');
      }

      const data = await response.json();
      setConferences(data.conferences || []);
    } catch (error) {
      console.error('Error fetching conferences:', error);
    } finally {
      setConferencesLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const now = new Date().toISOString();

      let totalSessionsQuery = supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true });

      let upcomingSessionsQuery = supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gte('datetime', now);

      let completedSessionsQuery = supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .lt('datetime', now);

      if (!isPlanner) {
        totalSessionsQuery = totalSessionsQuery.or(`visibility.eq.public,created_by.eq.${profile.id}`);
        upcomingSessionsQuery = upcomingSessionsQuery.or(`visibility.eq.public,created_by.eq.${profile.id}`);
        completedSessionsQuery = completedSessionsQuery.or(`visibility.eq.public,created_by.eq.${profile.id}`);
      }

      const { count: totalSessionsCount } = await totalSessionsQuery;
      const { count: upcomingSessionsCount } = await upcomingSessionsQuery;
      const { count: completedSessionsCount } = await completedSessionsQuery;

      const { count: mySessionsCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', profile.id);

      const { count: pendingRequestsCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      let totalUsersCount = 0;
      if (isAdmin) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        totalUsersCount = count || 0;
      }

      setStats({
        totalSessions: totalSessionsCount || 0,
        upcomingSessions: upcomingSessionsCount || 0,
        totalUsers: totalUsersCount,
        mySessions: mySessionsCount || 0,
        pendingRequests: pendingRequestsCount || 0,
        completedSessions: completedSessionsCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    bgColor
  }: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-[#AFB6D2]/20 p-6 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#AFB6D2] mb-1">{title}</p>
          <p className="text-3xl font-bold text-[#1A2633]">
            {loading ? (
              <span className="inline-block w-16 h-8 bg-[#AFB6D2]/20 rounded animate-pulse"></span>
            ) : (
              value
            )}
          </p>
        </div>
        <div className={`w-14 h-14 rounded-xl ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-7 h-7 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="text-center lg:text-left">
        <h1 className="text-4xl font-bold text-[#1A2633] mb-2">
          Welcome back, {profile?.full_name?.split(' ')[0]}!
        </h1>
        <p className="text-lg text-[#AFB6D2]">
          Here's what's happening with your knowledge sharing platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions}
          icon={BookOpen}
          color="text-[#27A4F6]"
          bgColor="bg-[#27A4F6]/10"
        />

        <StatCard
          title="Upcoming Sessions"
          value={stats.upcomingSessions}
          icon={Clock}
          color="text-[#F06429]"
          bgColor="bg-[#F06429]/10"
        />

        <StatCard
          title="Completed Sessions"
          value={stats.completedSessions}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-100"
        />

        {isPlanner && (
          <StatCard
            title="My Sessions"
            value={stats.mySessions}
            icon={Calendar}
            color="text-[#27A4F6]"
            bgColor="bg-[#27A4F6]/10"
          />
        )}

        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={TrendingUp}
          color="text-[#F06429]"
          bgColor="bg-[#F06429]/10"
        />

        {isAdmin && (
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            color="text-[#27A4F6]"
            bgColor="bg-[#27A4F6]/10"
          />
        )}
      </div>

      {isPlanner && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-[#AFB6D2]/20 p-6">
            <h3 className="text-lg font-semibold text-[#1A2633] mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: '/sessions' }))}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#27A4F6] to-[#27A4F6]/80 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Browse Sessions</span>
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: '/requests' }))}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#F06429] to-[#F06429]/80 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">View Requests</span>
            </button>
            {isPlanner && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: '/calendar' }))}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#AFB6D2]/10 text-[#1A2633] rounded-lg hover:bg-[#AFB6D2]/20 transition-all"
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Open Calendar</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#AFB6D2]/20 p-6">
          <h3 className="text-lg font-semibold text-[#1A2633] mb-4">Platform Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#AFB6D2]/20">
              <span className="text-sm text-[#AFB6D2]">Your Role</span>
              <span className="text-sm font-semibold text-[#1A2633] capitalize">
                {profile?.role}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-[#AFB6D2]/20">
              <span className="text-sm text-[#AFB6D2]">Sessions Created</span>
              <span className="text-sm font-semibold text-[#1A2633]">
                {loading ? '...' : stats.mySessions}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#AFB6D2]">Active Requests</span>
              <span className="text-sm font-semibold text-[#1A2633]">
                {loading ? '...' : stats.pendingRequests}
              </span>
            </div>
          </div>
        </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-bold text-[#1A2633] mb-1">
            Upcoming Tech Conferences
          </h2>
          <p className="text-[#AFB6D2]">
            Stay updated with the latest industry events
          </p>
        </div>

        {conferencesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#27A4F6]/30 border-t-[#27A4F6] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#AFB6D2]">Loading conferences...</p>
            </div>
          </div>
        ) : conferences.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#AFB6D2]/20">
            <Calendar className="w-12 h-12 text-[#AFB6D2] mx-auto mb-4" />
            <p className="text-[#AFB6D2]">No upcoming conferences found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conferences.map((conference, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-[#AFB6D2]/20 p-6 hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-[#1A2633] mb-2">
                          {conference.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[#AFB6D2] mb-3">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{conference.date}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[#1A2633] mb-4 leading-relaxed">
                      {conference.description}
                    </p>

                    {conference.speakers && conference.speakers.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-[#AFB6D2] mb-2">Featured Speakers:</p>
                        <div className="flex flex-wrap gap-2">
                          {conference.speakers.map((speaker, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-[#F06429]/10 text-[#F06429] rounded-full text-sm font-medium"
                            >
                              {speaker}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      {conference.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-[#27A4F6]/10 text-[#27A4F6] rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <a
                    href={conference.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#27A4F6] to-[#27A4F6]/80 text-white rounded-lg hover:shadow-lg transition-all font-medium whitespace-nowrap self-start"
                  >
                    <span>Visit Website</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
