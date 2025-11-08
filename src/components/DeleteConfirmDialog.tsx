import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function DeleteConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
  isDeleting = false
}: DeleteConfirmDialogProps) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <div
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#F06429]/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[#F06429]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#1A2633] mb-2">
                {title}
              </h3>
              <p className="text-sm text-[#AFB6D2] mb-4">
                {message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-[#AFB6D2]/30 text-[#1A2633] rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-[#F06429] text-white rounded-lg hover:bg-[#F06429]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
