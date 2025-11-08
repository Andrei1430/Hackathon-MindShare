import { Calendar, Clock, CheckCircle, XCircle, Clock as PendingIcon, Lock, Globe } from 'lucide-react';
import type { SessionRequestWithDetails } from '../types/request';

interface RequestCardProps {
  request: SessionRequestWithDetails;
  canApprove?: boolean;
  onRequestClick?: (request: SessionRequestWithDetails) => void;
}

export default function RequestCard({ request, canApprove = false, onRequestClick }: RequestCardProps) {
  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return { dateStr, timeStr };
  };

  const { dateStr, timeStr } = formatDateTime(request.datetime);

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending':
        return (
          <div className="flex items-center gap-1 px-3 py-1 bg-[#27A4F6]/10 text-[#27A4F6] rounded-full text-xs font-medium">
            <PendingIcon className="w-3 h-3" />
            <span>Pending</span>
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            <span>Approved</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1 px-3 py-1 bg-[#F06429]/10 text-[#F06429] rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </div>
        );
    }
  };

  const handleClick = () => {
    if (canApprove && onRequestClick) {
      onRequestClick(request);
    }
  };

  const isClickable = canApprove;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-[#AFB6D2]/20 hover:shadow-md transition-all overflow-hidden flex flex-col h-full ${isClickable ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-[#1A2633] mb-2">
              {request.title}
            </h3>
            <p className="text-sm text-[#AFB6D2] line-clamp-2">
              {request.description}
            </p>
          </div>
          <div className="ml-4 flex gap-2">
            {getStatusBadge()}
            {request.visibility === 'private' ? (
              <div className="flex items-center gap-1 px-3 py-1 bg-[#F06429]/10 text-[#F06429] rounded-full text-xs font-medium">
                <Lock className="w-3 h-3" />
                <span>Private</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1 bg-[#27A4F6]/10 text-[#27A4F6] rounded-full text-xs font-medium">
                <Globe className="w-3 h-3" />
                <span>Public</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-[#27A4F6]" />
            <span className="text-[#1A2633] font-medium">{dateStr}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-[#27A4F6]" />
            <span className="text-[#1A2633] font-medium">{timeStr}</span>
          </div>
        </div>

        {request.status === 'rejected' && request.rejection_reason && (
          <div className="mb-4 p-3 bg-[#F06429]/5 border border-[#F06429]/20 rounded-lg">
            <p className="text-xs font-medium text-[#F06429] mb-1">Rejection Reason</p>
            <p className="text-sm text-[#1A2633]">{request.rejection_reason}</p>
          </div>
        )}

        <div className="pt-4 border-t border-[#AFB6D2]/20 mt-auto">
          <div className="flex items-center justify-between">
            <div className="text-xs text-[#AFB6D2]">
              Requested by <span className="font-medium text-[#1A2633]">{request.user_name}</span>
            </div>
            {request.reviewed_by && request.reviewer_name && (
              <div className="text-xs text-[#AFB6D2]">
                Reviewed by <span className="font-medium text-[#1A2633]">{request.reviewer_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`h-1 ${
          request.status === 'pending'
            ? 'bg-gradient-to-r from-[#27A4F6] to-[#F06429]'
            : request.status === 'approved'
            ? 'bg-green-500'
            : 'bg-[#F06429]'
        }`}
      />
    </div>
  );
}
