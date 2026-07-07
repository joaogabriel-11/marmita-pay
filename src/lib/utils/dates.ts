import { APP_TIME_ZONE } from "@/lib/core/constants";

export function now(): Date {
  return new Date();
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function getSaoPauloDateParts(date = now()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
  };
}

export function getTodayInSaoPaulo(date = now()): string {
  const { year, month, day } = getSaoPauloDateParts(date);
  return `${year}-${month}-${day}`;
}

export function isBeforeCutoff(
  cutoffTime: string,
  date = now(),
): boolean {
  const { hour, minute } = getSaoPauloDateParts(date);
  return `${hour}:${minute}` < cutoffTime;
}
