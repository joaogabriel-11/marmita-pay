"use client";

import { useEffect, useRef, useState } from "react";
import {
  NotificationToast,
  type NotificationToastState,
} from "@/components/ui/notification-toast";
import {
  createSupabaseBrowserClient,
  type SupabaseRealtimeChannel,
} from "@/lib/supabase/browser-client";
import {
  playNotificationSound,
  unlockNotificationSound,
} from "@/lib/utils/notification-sound";

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
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [notification, setNotification] =
    useState<NotificationToastState | null>(null);
  const notifiedIdsRef = useRef(new Set<string>());
  const realtimeFilter = restauranteId
    ? `restaurante_id=eq.${restauranteId}`
    : undefined;

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
    if (!supabaseUrl || !supabaseAnonKey) {
      return;
    }

    let isMounted = true;
    let channel: SupabaseRealtimeChannel | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    async function subscribeToRealtime() {
      const supabase = await createSupabaseBrowserClient(
        supabaseUrl,
        supabaseAnonKey,
      );

      if (!isMounted) {
        return;
      }

      channel = supabase
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
        .subscribe((status) => {
          if (
            status === "TIMED_OUT" ||
            status === "CHANNEL_ERROR" ||
            status === "CLOSED"
          ) {
            reconnectTimeout = setTimeout(() => {
              setReconnectAttempt((attempt) => attempt + 1);
            }, 1500);
          }
        });
    }

    subscribeToRealtime().catch(() => {
      if (!isMounted) {
        return;
      }

      reconnectTimeout = setTimeout(() => {
        setReconnectAttempt((attempt) => attempt + 1);
      }, 1500);
    });

    return () => {
      isMounted = false;

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      const activeChannel = channel;

      if (activeChannel) {
        createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
          .then((supabase) => {
            supabase.removeChannel(activeChannel);
          })
          .catch(() => undefined);
      }
    };
  }, [
    realtimeFilter,
    reconnectAttempt,
    restauranteId,
    supabaseAnonKey,
    supabaseUrl,
  ]);

  return (
    <>
      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </>
  );
}
