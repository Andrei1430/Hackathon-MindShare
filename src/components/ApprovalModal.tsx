import { useState } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { SessionRequestWithDetails } from '../types/request';

interface ApprovalModalProps {
  request: SessionRequestWithDetails;
  onClose: () => void;
  onUpdate: () => void;
  userRole?: string;
  onCreateSession?: (request: SessionRequestWithDetails) => void;
}

export default function ApprovalModal({ request, onClose, onUpdate, userRole, onCreateSession }: ApprovalModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const isBasicUser = userRole === 'basic';
  const isApprovedRequest = request.status === 'approved';

  const handleApprove = async () => {
    try {
      setProcessing(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if ((isBasicUser && isApprovedRequest) && onCreateSession) {
        onClose();
        onCreateSession(request);
        return;
      }

      const { error: updateError } = await supabase
        .from('session_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error approving request:', err);
      setError('Failed to approve request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('session_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl shadow-2xl z-50">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#AFB6D2]/20">
          <h2 className="text-xl font-semibold text-[#1A2633]">Review Request</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#AFB6D2]" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#1A2633] mb-2">
              {request.title}
            </h3>
            <p className="text-sm text-[#AFB6D2] mb-4">
              {request.description}
            </p>
            <div className="text-xs text-[#AFB6D2]">
              Requested by <span className="font-medium text-[#1A2633]">{request.user_name}</span>
            </div>
          </div>

          {!isBasicUser && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A2633] mb-2">
                  Rejection Reason (required for rejection)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent resize-none"
                  placeholder="Provide a reason if you plan to reject this request..."
                />
              </div>

              {error && (
                <div className="p-3 bg-[#F06429]/10 border border-[#F06429]/20 rounded-lg">
                  <p className="text-sm text-[#F06429]">{error}</p>
                </div>
              )}
            </div>
          )}

          {isBasicUser && isApprovedRequest && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                This request has been approved. Click "Create Session" to schedule this session.
              </p>
            </div>
          )}

          {error && isBasicUser && (
            <div className="p-3 bg-[#F06429]/10 border border-[#F06429]/20 rounded-lg mt-4">
              <p className="text-sm text-[#F06429]">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#AFB6D2]/20 flex gap-3">
          {!isBasicUser && (
            <button
              onClick={handleReject}
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-[#F06429] text-[#F06429] rounded-lg hover:bg-[#F06429]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={handleApprove}
            disabled={processing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{isBasicUser ? 'Create Session' : 'Approve'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
