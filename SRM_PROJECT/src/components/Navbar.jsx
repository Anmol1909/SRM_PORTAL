import { AlertTriangle, Bell, CheckCircle, FileText, Info, Menu, Search, ShieldCheck, ShoppingCart, Star } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from './Button.jsx';
import ThemeToggle from '../../Theme.jsx';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_EVENT,
  notificationTypeStyles,
} from '../utils/notificationStore.js';

const notificationIcons = {
  alert: AlertTriangle,
  bell: Bell,
  cart: ShoppingCart,
  check: CheckCircle,
  file: FileText,
  info: Info,
  star: Star,
};

export function Navbar({ title, onMenu }) {
  const location = useLocation();
  const panelRef = useRef(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => getNotifications());
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const notificationPagePath = useMemo(() => (
    location.pathname.startsWith('/admin') ? '/admin/notifications' : '/supplier/notifications'
  ), [location.pathname]);

  useEffect(() => {
    const refresh = () => setNotifications(getNotifications());
    window.addEventListener(NOTIFICATION_EVENT, refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    if (!isNotificationsOpen) return undefined;

    const handleClickAway = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickAway);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isNotificationsOpen]);

  const handleMarkRead = (id) => {
    setNotifications(markNotificationRead(id));
  };

  const handleMarkAllRead = () => {
    setNotifications(markAllNotificationsRead());
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 shadow-[0_1px_12px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6 dark:bg-slate-950/95 dark:border-slate-800/80 dark:shadow-[0_1px_12px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="h-9 w-9 p-0 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h1>
          <p className="hidden text-xs text-slate-400 dark:text-slate-500 sm:block">
            {greeting} &mdash; {dateStr}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden w-64 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-400 transition focus-within:border-brand-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-100 md:flex dark:border-slate-800 dark:bg-slate-900/80 dark:focus-within:border-brand-500">
          <Search className="h-4 w-4 flex-shrink-0 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search suppliers, RFQs, POs…"
            className="w-full bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-white"
          />
        </div>
        
        <ThemeToggle />

        <Link to="/privacy" title="Privacy Policy & Registry">
          <Button variant="ghost" className="h-11 w-11 p-0 dark:text-slate-300 dark:hover:bg-slate-800">
            <ShieldCheck className="h-5 w-5" />
          </Button>
        </Link>

        <div className="relative" ref={panelRef}>
          <Button
            variant="ghost"
            className="h-11 w-11 p-0 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
            onClick={() => setIsNotificationsOpen((current) => !current)}
          >
            <Bell className="h-5 w-5" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-950">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}

          {isNotificationsOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,26rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/12 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <div>
                  <p className="text-sm font-bold text-slate-950 dark:text-white">Notifications</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.slice(0, 5).map((notification) => {
                  const Icon = notificationIcons[notification.icon] || Bell;

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleMarkRead(notification.id)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900 ${
                        notification.read ? '' : 'bg-blue-50/40 dark:bg-blue-950/10'
                      }`}
                    >
                      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className={`text-sm leading-5 ${notification.read ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-bold text-slate-950 dark:text-white'}`}>
                            {notification.title}
                          </span>
                          {!notification.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {notification.body}
                        </span>
                        <span className="mt-2 flex items-center justify-between gap-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${notificationTypeStyles[notification.type] || notificationTypeStyles.Business}`}>
                            {notification.type}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">{notification.time}</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 p-3 dark:border-slate-800">
                <Link
                  to={notificationPagePath}
                  onClick={() => setIsNotificationsOpen(false)}
                  className="flex w-full items-center justify-center rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  Open notification page
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
