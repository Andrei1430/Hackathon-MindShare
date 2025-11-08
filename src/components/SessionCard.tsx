import { useState } from 'react';
import { Calendar, Clock, FileText, Video, Lock, Globe, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { SessionWithDetails } from '../types/session';
import DeleteConfirmDialog from './DeleteConfirmDialog';

interface SessionCardProps {
  session: SessionWithDetails;
  onDelete?: () => void;
  onClick?: () => void;
}

export default function SessionCard({ session, onDelete, onClick }: SessionCardProps) {
  const { profile } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = profile?.role === 'admin' || profile?.role === 'planner';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', session.id);

      if (error) throw error;

      onDelete?.();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
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

  const isUpcoming = new Date(session.datetime) > new Date();
  const { dateStr, timeStr } = formatDateTime(session.datetime);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#AFB6D2]/20 hover:shadow-md transition-all overflow-hidden flex flex-col">
      <div className="p-6 flex-1 cursor-pointer" onClick={onClick}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-[#1A2633] mb-2">
              {session.title}
            </h3>
            <p className="text-sm text-[#AFB6D2] line-clamp-2">
              {session.description}
            </p>
          </div>
          <div className="ml-4">
            {session.visibility === 'private' ? (
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

        <div className="flex flex-wrap gap-2 mb-4">
          {session.tags.map((tag) => (
            <span
              key={tag.id}
              className="px-3 py-1 text-xs font-medium rounded-full text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
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

        <div className="pt-4 border-t border-[#AFB6D2]/20">
          <div className="flex items-center gap-3 mb-4 h-8">
            {session.presentation_url && (
              <a
                href={session.presentation_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#27A4F6] hover:bg-[#27A4F6]/10 rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Slides</span>
              </a>
            )}
            {session.recording_url && (
              <a
                href={session.recording_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#F06429] hover:bg-[#F06429]/10 rounded-lg transition-colors"
              >
                <Video className="w-4 h-4" />
                <span>Recording</span>
              </a>
            )}
            {!session.presentation_url && !session.recording_url && (
              <span className="text-sm text-[#AFB6D2] italic">
                {isUpcoming ? 'Materials will be available soon' : 'No materials available'}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-[#AFB6D2]">
              Created by <span className="font-medium text-[#1A2633]">{session.creator_name}</span>
            </div>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
                className="p-2 text-[#F06429] hover:bg-[#F06429]/10 rounded-lg transition-colors"
                title="Delete session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className={`h-1 w-full ${
          isUpcoming
            ? 'bg-gradient-to-r from-[#27A4F6] to-[#F06429]'
            : 'bg-[#AFB6D2]/30'
        }`}
      />
      {showDeleteDialog && (
        <DeleteConfirmDialog
          title="Delete Session"
          message={`Are you sure you want to delete "${session.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
