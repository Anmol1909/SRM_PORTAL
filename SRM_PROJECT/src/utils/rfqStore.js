import { rfqs as seedRfqs } from '../data/mockData.js';

const RFQ_STORAGE_KEY = 'srm.rfqs';
const RFQ_DELETED_STORAGE_KEY = 'srm.rfqs.deleted';
export const RFQ_EVENT = 'srm:rfqs-changed';

function canUseStorage() {
  return typeof window !== 'undefined' && window.localStorage;
}

export function getStoredRfqs() {
  if (!canUseStorage()) return seedRfqs;

  try {
    const stored = window.localStorage.getItem(RFQ_STORAGE_KEY);
    return stored ? JSON.parse(stored) : seedRfqs;
  } catch {
    return seedRfqs;
  }
}

export function getDeletedRfqIds() {
  if (!canUseStorage()) return [];

  try {
    const stored = window.localStorage.getItem(RFQ_DELETED_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveStoredRfqs(rfqs) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(RFQ_STORAGE_KEY, JSON.stringify(rfqs));
  window.dispatchEvent(new CustomEvent(RFQ_EVENT));
}

export function mergeRfqLists(remoteRfqs = [], localRfqs = getStoredRfqs()) {
  const deletedIds = new Set(getDeletedRfqIds());
  const merged = new Map();

  remoteRfqs
    .filter((rfq) => !deletedIds.has(rfq.id))
    .forEach((rfq) => merged.set(rfq.id, rfq));

  localRfqs
    .filter((rfq) => !deletedIds.has(rfq.id))
    .forEach((rfq) => merged.set(rfq.id, { ...merged.get(rfq.id), ...rfq }));

  return Array.from(merged.values()).sort((a, b) => {
    const aTime = Number(a.localUpdatedAt || Date.parse(a.created_at || a.deadline || '') || 0);
    const bTime = Number(b.localUpdatedAt || Date.parse(b.created_at || b.deadline || '') || 0);
    return bTime - aTime;
  });
}

export function rememberDeletedRfq(id) {
  if (!canUseStorage()) return;
  const deletedIds = new Set(getDeletedRfqIds());
  deletedIds.add(id);
  window.localStorage.setItem(RFQ_DELETED_STORAGE_KEY, JSON.stringify(Array.from(deletedIds)));
  saveStoredRfqs(getStoredRfqs().filter((rfq) => rfq.id !== id));
}

export function createRfqId(rfqs) {
  const maxNumber = rfqs.reduce((max, rfq) => {
    const match = String(rfq.id).match(/RFQ-(\d+)/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 24000);

  return `RFQ-${maxNumber + 1}`;
}
