import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Trash2, Edit, Shield, Users as UsersIcon, User } from 'lucide-react';
import type { Profile } from '../lib/supabase';
import EditUserPane from '../components/EditUserPane';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

export default function Users() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'planner' | 'basic'>('all');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      return;
    }
    fetchUsers();
  }, [profile]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      setUsers(users.filter(u => u.id !== userId));
      setDeletingUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#27A4F6]/10 text-[#27A4F6] rounded-full text-xs font-medium">
            <Shield className="w-3 h-3" />
            Admin
          </span>
        );
      case 'planner':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F06429]/10 text-[#F06429] rounded-full text-xs font-medium">
            <UsersIcon className="w-3 h-3" />
            Planner
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#AFB6D2]/10 text-[#AFB6D2] rounded-full text-xs font-medium">
            <User className="w-3 h-3" />
            User
          </span>
        );
    }
  };

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[#AFB6D2] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1A2633] mb-2">Access Denied</h2>
          <p className="text-[#AFB6D2]">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1A2633]">User Management</h1>
          <p className="text-[#AFB6D2] mt-1">Manage users, roles, and permissions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#AFB6D2]/20 overflow-hidden">
          <div className="p-6 border-b border-[#AFB6D2]/20">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#AFB6D2]" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#AFB6D2]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27A4F6] focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRoleFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === 'all'
                      ? 'bg-[#27A4F6] text-white'
                      : 'bg-[#AFB6D2]/10 text-[#AFB6D2] hover:bg-[#AFB6D2]/20'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setRoleFilter('admin')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === 'admin'
                      ? 'bg-[#27A4F6] text-white'
                      : 'bg-[#AFB6D2]/10 text-[#AFB6D2] hover:bg-[#AFB6D2]/20'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => setRoleFilter('planner')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === 'planner'
                      ? 'bg-[#F06429] text-white'
                      : 'bg-[#AFB6D2]/10 text-[#AFB6D2] hover:bg-[#AFB6D2]/20'
                  }`}
                >
                  Planner
                </button>
                <button
                  onClick={() => setRoleFilter('basic')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === 'basic'
                      ? 'bg-[#AFB6D2] text-white'
                      : 'bg-[#AFB6D2]/10 text-[#AFB6D2] hover:bg-[#AFB6D2]/20'
                  }`}
                >
                  User
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#27A4F6]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#AFB6D2] uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#AFB6D2] uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#AFB6D2] uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[#AFB6D2] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#AFB6D2]/20">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-[#AFB6D2]">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[#1A2633]">{user.full_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[#AFB6D2]">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[#27A4F6] hover:bg-[#27A4F6]/10 rounded-lg transition-colors mr-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[#F06429] hover:bg-[#F06429]/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingUser && (
        <EditUserPane
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(updatedUser) => {
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            setEditingUser(null);
          }}
        />
      )}

      {deletingUser && (
        <DeleteConfirmDialog
          title="Delete User"
          message={`Are you sure you want to delete ${deletingUser.full_name}? This action cannot be undone and will permanently remove the user and all their data.`}
          onCancel={() => setDeletingUser(null)}
          onConfirm={() => handleDeleteUser(deletingUser.id)}
        />
      )}
    </div>
  );
}
