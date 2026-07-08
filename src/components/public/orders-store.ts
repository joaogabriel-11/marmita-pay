"use client";

import { useSyncExternalStore } from "react";

export type StoredOrder = {
  codigoPedido: number;
  createdAt: string;
};

export const ORDERS_STORAGE_KEY = "marmita-pay-orders";

const EMPTY_ORDERS: StoredOrder[] = [];
let ordersSnapshot: StoredOrder[] | null = null;

export function readStoredOrders(): StoredOrder[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawOrders = window.localStorage.getItem(ORDERS_STORAGE_KEY);

  if (!rawOrders) {
    return [];
  }

  try {
    const parsedOrders = JSON.parse(rawOrders) as StoredOrder[];
    return parsedOrders.filter((order) =>
      Number.isInteger(order.codigoPedido),
    );
  } catch {
    return [];
  }
}

export function writeStoredOrders(orders: StoredOrder[]): void {
  ordersSnapshot = orders;
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new Event("orders:updated"));
}

export function rememberOrder(codigoPedido: number): void {
  if (typeof window === "undefined" || !Number.isInteger(codigoPedido)) {
    return;
  }

  const orders = readStoredOrders();
  const withoutCurrent = orders.filter(
    (order) => order.codigoPedido !== codigoPedido,
  );

  writeStoredOrders([
    { codigoPedido, createdAt: new Date().toISOString() },
    ...withoutCurrent,
  ].slice(0, 20));
}

export function removeStoredOrder(codigoPedido: number): void {
  writeStoredOrders(
    readStoredOrders().filter((order) => order.codigoPedido !== codigoPedido),
  );
}

function getOrdersSnapshot(): StoredOrder[] {
  if (typeof window === "undefined") {
    return EMPTY_ORDERS;
  }

  if (ordersSnapshot === null) {
    ordersSnapshot = readStoredOrders();
  }

  return ordersSnapshot;
}

function getServerOrdersSnapshot(): StoredOrder[] {
  return EMPTY_ORDERS;
}

function subscribeOrders(callback: () => void): () => void {
  window.addEventListener("orders:updated", callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("orders:updated", callback);
    window.removeEventListener("storage", callback);
  };
}

export function useStoredOrders(): StoredOrder[] {
  return useSyncExternalStore(
    subscribeOrders,
    getOrdersSnapshot,
    getServerOrdersSnapshot,
  );
}
