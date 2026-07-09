"use client";

import { createClient } from "@supabase/supabase-js";

type RealtimePayload<T> = {
  new: T;
};

export type SupabaseRealtimeStatus =
  | "SUBSCRIBED"
  | "TIMED_OUT"
  | "CHANNEL_ERROR"
  | "CLOSED"
  | string;

export type SupabaseRealtimeChannel = {
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
  subscribe: (
    callback?: (status: SupabaseRealtimeStatus) => void,
  ) => SupabaseRealtimeChannel;
};

export type SupabaseBrowserClient = {
  channel: (name: string) => SupabaseRealtimeChannel;
  removeChannel: (channel: SupabaseRealtimeChannel) => unknown;
};

const clients = new Map<string, SupabaseBrowserClient>();

export async function createSupabaseBrowserClient(
  supabaseUrl: string,
  supabaseAnonKey: string,
) {
  const cacheKey = `${supabaseUrl}:${supabaseAnonKey}`;
  const cachedClient = clients.get(cacheKey);

  if (cachedClient) {
    return cachedClient;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }) as unknown as SupabaseBrowserClient;

  clients.set(cacheKey, client);
  return client;
}
