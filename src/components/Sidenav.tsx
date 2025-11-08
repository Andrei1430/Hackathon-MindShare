import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  Calendar,
  User,
  Search,
  FileText,
  ClipboardList,
  Users,
  LogOut,
  Menu,
  X,
  Brain,
  Inbox
} from 'lucide-react';
import type { UserRole } from '../lib/supabase';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  allowedRoles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Sessions', icon: Calendar, path: '/sessions' },
  { label: 'Requests', icon: Inbox, path: '/requests' },
  { label: 'Calendar', icon: ClipboardList, path: '/calendar', allowedRoles: ['admin', 'planner'] },
  { label: 'Users', icon: Users, path: '/users', allowedRoles: ['admin'] },
];

const getRoleBadgeColor = (role: UserRole) => {
  switch (role) {
    case 'admin':
      return 'bg-[#F06429] text-white';
    case 'planner':
      return 'bg-[#27A4F6] text-white';
    case 'basic':
      return 'bg-[#AFB6D2] text-white';
    default:
      return 'bg-[#AFB6D2] text-white';
  }
};

const getRoleLabel = (role: UserRole) => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};

interface SidenavProps {
  activePath: string;
  onNavigate: (path: string) => void;
}

export default function Sidenav({ activePath, onNavigate }: SidenavProps) {
  const { profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const filteredNavItems = navItems.filter(item => {
    if (!item.allowedRoles) return true;
    return profile?.role && item.allowedRoles.includes(profile.role);
  });

  const handleNavClick = (path: string) => {
    onNavigate(path);
    setIsOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg text-[#1A2633] hover:bg-[#F6F8FC] transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-[#AFB6D2]/20 flex flex-col transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-[#AFB6D2]/20">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#27A4F6] to-[#F06429] p-2 rounded-xl">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#1A2633]">MindShare</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.path;

              return (
                <li key={item.path}>
                  <button
                    onClick={() => handleNavClick(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#27A4F6] to-[#27A4F6]/80 text-white shadow-md'
                        : 'text-[#1A2633] hover:bg-[#F6F8FC]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-[#AFB6D2]/20 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-[#F6F8FC] rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#27A4F6] to-[#F06429] flex items-center justify-center text-white font-semibold text-sm">
              {profile?.full_name ? getInitials(profile.full_name) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A2633] truncate">
                {profile?.full_name || 'User'}
              </p>
              {profile?.role && (
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mt-1 ${getRoleBadgeColor(
                    profile.role
                  )}`}
                >
                  {getRoleLabel(profile.role)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#F06429] to-[#F06429]/80 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </>
  );
}
