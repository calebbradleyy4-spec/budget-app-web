import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

const links = [
  { to: '/', label: 'Dashboard', icon: '🏠', exact: true },
  { to: '/transactions', label: 'Transactions', icon: '💳', exact: false },
  { to: '/budgets', label: 'Budgets', icon: '🎯', exact: false },
  { to: '/reports', label: 'Reports', icon: '📊', exact: false },
  { to: '/settings', label: 'Settings', icon: '⚙️', exact: false },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-xl font-bold text-indigo-600">Budget App</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <span>🚪</span>
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-white h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile hamburger */}
      <div className="md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-white shadow border border-gray-200"
        >
          <span className="sr-only">Open menu</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col">
              {navContent}
            </aside>
          </>
        )}
      </div>
    </>
  );
}
