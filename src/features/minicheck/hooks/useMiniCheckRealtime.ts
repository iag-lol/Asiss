import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isMiniCheckConfigured, minicheckSupabase } from '../api/minicheckClient';

export type RealtimeStatus = 'disabled' | 'connecting' | 'live' | 'error';

export interface RealtimeEventInfo {
  at: Date;
  table: string;
}

const REALTIME_TABLES = [
  'revisiones',
  'camaras',
  'tags',
  'extintores',
  'mobileye',
  'odometro',
  'rack',
  'wifi',
  'publicidad',
  'tickets',
  'flota',
] as const;

export const useMiniCheckRealtime = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>(
    isMiniCheckConfigured() ? 'connecting' : 'disabled',
  );
  const [lastEvent, setLastEvent] = useState<RealtimeEventInfo | null>(null);

  useEffect(() => {
    if (!isMiniCheckConfigured()) {
      setStatus('disabled');
      return;
    }

    const channel = minicheckSupabase.channel('asiss-mini-check-live');
    let refreshTimer: number | undefined;

    REALTIME_TABLES.forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          setLastEvent({
            at: new Date(),
            table: payload.table || table,
          });
          window.clearTimeout(refreshTimer);
          refreshTimer = window.setTimeout(() => {
            void queryClient.invalidateQueries({ queryKey: ['minicheck'] });
          }, 500);
        },
      );
    });

    channel.subscribe((subscriptionStatus) => {
      if (subscriptionStatus === 'SUBSCRIBED') setStatus('live');
      if (
        subscriptionStatus === 'CHANNEL_ERROR' ||
        subscriptionStatus === 'TIMED_OUT'
      ) {
        setStatus('error');
      }
      if (subscriptionStatus === 'CLOSED') setStatus('connecting');
    });

    return () => {
      window.clearTimeout(refreshTimer);
      void minicheckSupabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { status, lastEvent };
};
