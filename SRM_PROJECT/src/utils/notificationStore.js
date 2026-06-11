const STORAGE_KEY = 'srm_notifications';
export const NOTIFICATION_EVENT = 'srm:notifications-changed';

export const notificationTypeStyles = {
  'Action Required': 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-500/30',
  Alert: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-500/30',
  Business: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-500/30',
  System: 'bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-500/30',
};

const seedNotifications = [
  {
    id: 'seed-rfq-24061',
    category: 'sourcing',
    icon: 'file',
    title: 'New RFQ invitation: Precision CNC Aluminum Housings',
    body: 'You have been invited to submit a bid. Deadline: Jun 10, 2026.',
    time: '12 min ago',
    createdAt: Date.now() - 12 * 60 * 1000,
    read: false,
    type: 'Business',
    link: '/supplier/rfqs',
  },
  {
    id: 'seed-po-88021',
    category: 'orders',
    icon: 'cart',
    title: 'PO-88021 shipment document requested',
    body: 'Apex Industrial Components requires your shipping documentation by Jun 3.',
    time: '1 hr ago',
    createdAt: Date.now() - 60 * 60 * 1000,
    read: false,
    type: 'Action Required',
    link: '/supplier/orders',
  },
  {
    id: 'seed-scorecard',
    category: 'performance',
    icon: 'star',
    title: 'Quarterly scorecard available for review',
    body: 'Your Q1 2026 performance scorecard has been published.',
    time: '5 hr ago',
    createdAt: Date.now() - 5 * 60 * 60 * 1000,
    read: false,
    type: 'Business',
    link: '/supplier/performance',
  },
  {
    id: 'seed-maintenance',
    category: 'system',
    icon: 'info',
    title: 'System maintenance scheduled',
    body: 'The SRM portal will be under maintenance on Jun 1, 2026 from 2-4 AM IST.',
    time: '2 days ago',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    read: true,
    type: 'System',
    link: '/supplier/notifications',
  },
];

function broadcast() {
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT));
}

function normalize(notification) {
  const createdAt = notification.createdAt || Date.now();

  return {
    id: notification.id || `notif-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    category: notification.category || 'system',
    icon: notification.icon || 'bell',
    title: notification.title || 'New notification',
    body: notification.body || '',
    time: notification.time || 'Just now',
    createdAt,
    read: Boolean(notification.read),
    type: notification.type || 'Business',
    link: notification.link || '/supplier/notifications',
  };
}

export function getNotifications() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(stored)) {
      return stored.map(normalize).sort((a, b) => b.createdAt - a.createdAt);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedNotifications));
  return seedNotifications;
}

export function saveNotifications(notifications) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.map(normalize)));
  broadcast();
}

export function addNotification(notification) {
  const next = [normalize(notification), ...getNotifications()];
  saveNotifications(next);
  return next;
}

export function markNotificationRead(id) {
  const next = getNotifications().map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification,
  );
  saveNotifications(next);
  return next;
}

export function markAllNotificationsRead() {
  const next = getNotifications().map((notification) => ({ ...notification, read: true }));
  saveNotifications(next);
  return next;
}
