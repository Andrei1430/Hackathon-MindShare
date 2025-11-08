import { Calendar, X } from 'lucide-react';
import type { SessionWithDetails } from '../types/session';

interface OutlookCalendarModalProps {
  session: SessionWithDetails;
  onClose: () => void;
}

export default function OutlookCalendarModal({ session, onClose }: OutlookCalendarModalProps) {
  const generateOutlookLink = () => {
    const startDate = new Date(session.datetime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatDateTime = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: session.title,
      body: session.description,
      startdt: formatDateTime(startDate),
      enddt: formatDateTime(endDate),
      location: 'Online'
    });

    return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  const handleSaveToOutlook = () => {
    const outlookLink = generateOutlookLink();
    window.open(outlookLink, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#27A4F6]/10 rounded-lg">
                <Calendar className="w-6 h-6 text-[#27A4F6]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#1A2633]">
                  Add to Outlook Calendar
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#AFB6D2]/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[#AFB6D2]" />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-[#F6F8FC] rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-[#1A2633]">{session.title}</h4>
              <p className="text-sm text-[#AFB6D2]">
                {new Date(session.datetime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-sm text-[#AFB6D2]">
                {new Date(session.datetime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <p className="text-sm text-[#AFB6D2] mt-4">
              This will open Outlook in a new window with the session details pre-filled.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#AFB6D2]/20 text-[#1A2633] rounded-lg hover:bg-[#AFB6D2]/30 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveToOutlook}
              className="flex-1 px-4 py-2 bg-[#27A4F6] text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              Save to Outlook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
