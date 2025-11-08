import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';

interface EditUserPaneProps {
  user: Profile;
  onClose: () => void;
  onSave: (user: Profile) => void;
}

export default function EditUserPane({ user, onClose, onSave }: EditUserPaneProps) {
  const [fullName, setFullName] = useState(user.full_name);
  const [role, setRole] = useState<'admin' | 'planner' | 'basic'>(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          role: role,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      onSave(data);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#AFB6D2]/20">
          <h2 className="text-xl font-semibold text-[#1A2633]">Edit User</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#AFB6D2]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1A2633] mb-2">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 border border-[#AFB6D2]/30 rounded-lg bg-slate-50 text-[#AFB6D2] cursor-not-allowed"
              />
              <p className="text-xs text-[#AFB6D2] mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2633] mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2633] mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'planner' | 'basic')}
                className="w-full px-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent"
              >
                <option value="basic">User</option>
                <option value="planner">Planner</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-[#F06429]/10 border border-[#F06429]/20 rounded-lg">
                <p className="text-sm text-[#F06429]">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#AFB6D2]/20 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 border border-[#AFB6D2]/30 text-[#1A2633] rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !fullName.trim()}
            className="flex-1 px-4 py-2 bg-[#27A4F6] text-white rounded-lg hover:bg-[#27A4F6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}
