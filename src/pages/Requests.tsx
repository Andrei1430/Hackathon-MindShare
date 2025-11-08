import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import RequestCard from '../components/RequestCard';
import NewRequestPane from '../components/NewRequestPane';
import NewSessionPane from '../components/NewSessionPane';
import ApprovalModal from '../components/ApprovalModal';
import type { SessionRequestWithDetails } from '../types/request';
import { Plus } from 'lucide-react';

export default function Requests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<SessionRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showNewRequestPane, setShowNewRequestPane] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SessionRequestWithDetails | null>(null);
  const [showNewSessionPane, setShowNewSessionPane] = useState(false);
  const [sessionFromRequest, setSessionFromRequest] = useState<SessionRequestWithDetails | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('session_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set([
        ...data.map(r => r.user_id),
        ...data.map(r => r.reviewed_by).filter(Boolean)
      ])];

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]));

      const requestsWithDetails: SessionRequestWithDetails[] = data.map((request: any) => ({
        ...request,
        user_name: profilesMap.get(request.user_id) || 'Unknown User',
        reviewer_name: request.reviewed_by ? profilesMap.get(request.reviewed_by) || null : null,
      }));

      setRequests(requestsWithDetails);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1A2633]">Session Requests</h1>
            <p className="text-[#AFB6D2] mt-1">
              {profile?.role === 'basic'
                ? 'View and manage your session requests'
                : 'View and manage all session requests'}
            </p>
          </div>
          <button
            onClick={() => setShowNewRequestPane(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#27A4F6] text-white rounded-lg hover:bg-[#27A4F6]/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Request</span>
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#27A4F6] text-white'
                : 'bg-white text-[#AFB6D2] hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-[#27A4F6] text-white'
                : 'bg-white text-[#AFB6D2] hover:bg-slate-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-white text-[#AFB6D2] hover:bg-slate-50'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'rejected'
                ? 'bg-[#F06429] text-white'
                : 'bg-white text-[#AFB6D2] hover:bg-slate-50'
            }`}
          >
            Rejected
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#27A4F6]"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#AFB6D2] text-lg">No requests found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                canApprove={profile?.role === 'admin' || profile?.role === 'planner' || (profile?.role === 'basic' && request.status === 'approved')}
                onRequestClick={setSelectedRequest}
              />
            ))}
          </div>
        )}
      </div>

      {showNewRequestPane && (
        <NewRequestPane
          onClose={() => setShowNewRequestPane(false)}
          onSave={() => {
            setShowNewRequestPane(false);
            fetchRequests();
          }}
        />
      )}

      {selectedRequest && (
        <ApprovalModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={() => {
            setSelectedRequest(null);
            fetchRequests();
          }}
          userRole={profile?.role}
          onCreateSession={(request) => {
            setSessionFromRequest(request);
            setShowNewSessionPane(true);
          }}
        />
      )}

      {showNewSessionPane && (
        <NewSessionPane
          onClose={() => {
            setShowNewSessionPane(false);
            setSessionFromRequest(null);
          }}
          onSave={() => {
            setShowNewSessionPane(false);
            setSessionFromRequest(null);
            fetchRequests();
          }}
          fromRequest={sessionFromRequest || undefined}
        />
      )}
    </div>
  );
}
