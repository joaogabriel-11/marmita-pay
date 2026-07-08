"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import {
  NotificationToast,
  type NotificationToastState,
} from "@/components/ui/notification-toast";
import {
  playNotificationSound,
  unlockNotificationSound,
} from "@/lib/utils/notification-sound";

type RealtimePayload<T> = {
  new: T;
};

type SupabaseRealtimeChannel = {
  on: (
    type: "postgres_changes",
    config: {
      event: "INSERT" | "UPDATE";
      schema: "public";
      table: string;
      filter?: string;
    },
    callback: (payload: RealtimePayload<Record<string, unknown>>) => void,
  ) => SupabaseRealtimeChannel;
  subscribe: (callback?: (status: string) => void) => SupabaseRealtimeChannel;
};

type SupabaseBrowserClient = {
  channel: (name: string) => SupabaseRealtimeChannel;
  removeChannel: (channel: SupabaseRealtimeChannel) => void;
};

declare global {
  interface Window {
    supabase?: {
      createClient: (
        url: string,
        anonKey: string,
      ) => SupabaseBrowserClient;
    };
  }
}

type AdminRealtimeNotificationsProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  restauranteId?: string | null;
};

type AdminNotificationRow = {
  tipo?: unknown;
  titulo?: unknown;
  mensagem?: unknown;
};

const TIPO_PEDIDO_CRIADO = "PEDIDO_CRIADO";
const TIPO_PAGAMENTO_APROVADO = "PAGAMENTO_APROVADO";

export function AdminRealtimeNotifications({
  supabaseUrl,
  supabaseAnonKey,
  restauranteId,
}: AdminRealtimeNotificationsProps) {
  const [scriptReady, setScriptReady] = useState(false);
  const [notification, setNotification] =
    useState<NotificationToastState | null>(null);
  const notifiedIdsRef = useRef(new Set<string>());
  const realtimeFilter = restauranteId
    ? `restaurante_id=eq.${restauranteId}`
    : undefined;
  const canUseRealtime = Boolean(supabaseUrl && supabaseAnonKey && scriptReady);

  function notify(notificationData: Omit<NotificationToastState, "id">) {
    setNotification({ id: Date.now(), ...notificationData });
  }

  useEffect(() => {
    const unlock = () => unlockNotificationSound();

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (!canUseRealtime || !window.supabase) {
      return;
    }

    const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    const channel = supabase
      .channel(`admin-global-notifications-${restauranteId ?? "single"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notificacoes_admin",
          ...(realtimeFilter ? { filter: realtimeFilter } : {}),
        },
        (payload) => {
          const row = payload.new as AdminNotificationRow &
            Record<string, unknown>;
          const notificationId = String(row.id ?? "");

          if (notificationId && notifiedIdsRef.current.has(notificationId)) {
            return;
          }

          if (notificationId) {
            notifiedIdsRef.current.add(notificationId);
          }

          const tipo = String(row.tipo ?? "");
          const title = String(row.titulo ?? "Nova notificacao");
          const message = String(row.mensagem ?? "");

          if (tipo === TIPO_PEDIDO_CRIADO) {
            playNotificationSound("new-order");
            notify({ title, message, tone: "info" });
            return;
          }

          if (tipo === TIPO_PAGAMENTO_APROVADO) {
            playNotificationSound("payment-approved");
            notify({ title, message, tone: "success" });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canUseRealtime, realtimeFilter, restauranteId, supabaseAnonKey, supabaseUrl]);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
        onLoad={() => setScriptReady(true)}
      />
      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </>
  );
}
