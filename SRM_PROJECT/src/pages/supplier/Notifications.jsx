import { AlertTriangle, Bell, CheckCircle, FileText, Info, ShoppingCart, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardHeader } from '../../components/Card.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_EVENT,
  notificationTypeStyles,
} from '../../utils/notificationStore.js';

const categories = ['All', 'Sourcing', 'Orders', 'Performance', 'System'];

const iconMap = {
  alert: { icon: AlertTriangle, iconColor: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300' },
  bell: { icon: Bell, iconColor: 'text-brand-600 bg-brand-50 dark:bg-brand-950/30 dark:text-brand-300' },
  cart: { icon: ShoppingCart, iconColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300' },
  check: { icon: CheckCircle, iconColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300' },
  file: { icon: FileText, iconColor: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-300' },
  info: { icon: Info, iconColor: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300' },
  star: { icon: Star, iconColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300' },
};

export function Notifications() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [notifications, setNotifications] = useState(() => getNotifications());

  useEffect(() => {
    const refresh = () => setNotifications(getNotifications());
    window.addEventListener(NOTIFICATION_EVENT, refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener(NOTIFICATION_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const filtered = notifications.filter(
    (notification) => activeCategory === 'All' || notification.category === activeCategory.toLowerCase(),
  );
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markAllRead = () => setNotifications(markAllNotificationsRead());
  const markRead = (id) => setNotifications(markNotificationRead(id));

  return (
    <>
      <PageHeader title="Notifications" description="System alerts, business updates, and action items from your procurement network." />

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </span>
          }
          subtitle="Stay updated on RFQs, orders, performance, and system events"
          action={
            unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
              >
                Mark all as read
              </button>
            )
          }
        />

        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-5 py-3 dark:border-slate-800">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                activeCategory === category
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">No notifications in this category</p>
            </div>
          )}

          {filtered.map((notification) => {
            const iconMeta = iconMap[notification.icon] || iconMap.bell;
            const Icon = iconMeta.icon;

            return (
              <div
                key={notification.id}
                onClick={() => markRead(notification.id)}
                className={`flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-900/60 ${
                  !notification.read ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''
                }`}
              >
                <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${iconMeta.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className={`text-sm ${notification.read ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-semibold text-slate-900 dark:text-white'}`}>
                      {notification.title}
                    </p>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${notificationTypeStyles[notification.type] || notificationTypeStyles.Business}`}>
                        {notification.type}
                      </span>
                      {!notification.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
                    </div>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{notification.body}</p>
                  <p className="mt-1.5 text-xs text-slate-400">{notification.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
