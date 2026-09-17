export const EASTERN_TIME_ZONE = "America/New_York";

export function validTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function formatKickoff(date: string, timeZone = EASTERN_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone, weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(date));
}

export function timeZoneLabel(timeZone: string): string {
  return timeZone.replaceAll("_", " ").split("/").join(" / ");
}
