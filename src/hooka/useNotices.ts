import { useSyncExternalStore } from 'react';
import { getNotices, subscribeNotices, type NoticeOutcome } from '@/lib/notify';

export function useNotices(): NoticeOutcome[] {
  return useSyncExternalStore(subscribeNotices, getNotices, getNotices);
}
