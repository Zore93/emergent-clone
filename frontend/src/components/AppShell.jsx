import React from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Coins, LogOut, LayoutDashboard, Sparkles, CreditCard, ShieldCheck } from 'lucide-react';

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const onLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <aside className="w-64 bg-white border-r border-neutral-200 hidden md:flex md:flex-col">
        <Link to="/" className="px-6 h-[64px] flex items-center">
          <span className="text-[22px] font-semibold tracking-tight text-neutral-900" style={{ fontFamily: "'Instrument Sans','Inter',sans-serif" }}>emergent</span>
        </Link>
        <nav className="flex-1 px-3 pt-2 space-y-1">
          <NavItem to="/dashboard" icon={LayoutDashboard}>Projects</NavItem>
          <NavItem to="/builder" icon={Sparkles}>New build</NavItem>
          <NavItem to="/billing" icon={CreditCard}>Billing &amp; credits</NavItem>
          {user?.role === 'admin' && <NavItem to="/admin" icon={ShieldCheck}>Admin</NavItem>}
        </nav>
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-neutral-900 truncate">{user?.name}</div>
              <div className="text-[11px] text-neutral-500 truncate">{user?.email}</div>
            </div>
            <button onClick={onLogout} title="Log out" className="text-neutral-500 hover:text-neutral-900"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="h-[64px] bg-white border-b border-neutral-200 flex items-center justify-between px-6">
          <div className="md:hidden text-[18px] font-semibold lowercase" style={{ fontFamily: "'Instrument Sans','Inter',sans-serif" }}>emergent</div>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/billing" className="inline-flex items-center gap-2 rounded-full bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 text-[13px] font-medium text-neutral-800 transition-colors">
              <Coins className="w-4 h-4 text-amber-500" /> {user?.credits ?? 0} credits
            </Link>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

function NavItem({ to, icon: Icon, children }) {
  return (
    <NavLink to={to} className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] transition-colors ${
        isActive ? 'bg-neutral-900 text-white' : 'text-neutral-700 hover:bg-neutral-100'
      }`
    }>
      <Icon className="w-4 h-4" /> {children}
    </NavLink>
  );
}
