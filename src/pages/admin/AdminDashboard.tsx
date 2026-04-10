import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Users, UserCog, MessageCircle, Home, FileText, ShieldCheck } from 'lucide-react';

const AdminDashboard = () => {
  const navItems = [
    { to: '/admin/overview', label: 'Overview', icon: Home },
    { to: '/admin/doctors', label: 'Therapists', icon: Users },
    { to: '/admin/users', label: 'Users', icon: UserCog },
    { to: '/admin/faqs', label: 'FAQs', icon: MessageCircle },
    { to: '/admin/articles', label: 'Articles', icon: FileText },
  ];

  return (
    <div className="content-shell py-8">
      <div className="surface-card mb-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">Control Center</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
              Monitor platform growth, manage content, and review user activity in one place.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-2 text-cyan-800">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-semibold">Admin Mode</span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-3 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? 'border-cyan-200 bg-cyan-100 text-cyan-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="surface-card overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;
