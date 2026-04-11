import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { MessageSquare, UserCircle, Stethoscope, LayoutDashboard, ShieldCheck } from 'lucide-react';

const DoctorDashboard = () => {
  const navItems = [
    { to: '/doctor/chats', label: 'Patient Connections', icon: MessageSquare },
    { to: '/doctor/profile', label: 'My Profile', icon: UserCircle },
  ];

  return (
    <div className="content-shell py-8">
      <div className="surface-card mb-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Therapist Workspace
            </p>
            <h1 className="mt-3 text-3xl font-bold text-[var(--mh-text)]">Therapist Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--mh-text-muted)]">
              Manage patient conversations, accept new connections, and keep your profile current from one secure workspace.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-semibold">Secure therapist mode</span>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? 'border-cyan-200 bg-cyan-100 text-cyan-900'
                  : 'border-[var(--mh-border)] bg-[var(--mh-surface)] text-[var(--mh-text-muted)] hover:bg-[var(--mh-surface-soft)]'
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

export default DoctorDashboard;
