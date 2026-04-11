import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Building2, Users, Activity, Settings, ClipboardCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getPendingCount } from '@/store/approvalStore';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/office', icon: Building2, label: 'Office' },
  { to: '/agents', icon: Users, label: 'Agents' },
  { to: '/activity', icon: Activity, label: 'Activity & Trust' },
  { to: '/approvals', icon: ClipboardCheck, label: 'Approvals' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const AppSidebar: React.FC = () => {
  const location = useLocation();
  const pendingCount = getPendingCount();

  return (
    <div className="w-14 bg-sidebar flex flex-col items-center py-4 border-r border-sidebar-border shrink-0">
      <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center mb-6">
        <span className="text-sidebar-primary-foreground font-display font-bold text-sm">H</span>
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);
          return (
            <Tooltip key={to} delayDuration={200}>
              <TooltipTrigger asChild>
                <NavLink
                  to={to}
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {to === '/approvals' && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
      <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground text-xs font-bold">
        Y
      </div>
    </div>
  );
};

export default AppSidebar;
