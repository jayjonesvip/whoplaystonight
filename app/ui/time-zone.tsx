"use client";

import { useId, useSyncExternalStore } from "react";
import { EASTERN_TIME_ZONE, formatKickoff, timeZoneLabel, validTimeZone } from "@/app/lib/time";

const STORAGE_KEY = "who-plays-tonight:time-zone";
const CHANGE_EVENT = "who-plays-tonight:time-zone-changed";
type Preference = "eastern" | "local";
let memoryPreference: Preference | null = null;

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    memoryPreference = null;
    onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function getPreference(): Preference {
  if (memoryPreference !== null) return memoryPreference;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "local" ? "local" : "eastern";
  } catch {
    return "eastern";
  }
}

function getLocalTimeZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone && validTimeZone(zone) ? zone : EASTERN_TIME_ZONE;
  } catch {
    return EASTERN_TIME_ZONE;
  }
}

function setPreference(preference: Preference) {
  memoryPreference = preference;
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // The selection still works for this visit when storage is unavailable.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useTimeZone() {
  const preference = useSyncExternalStore(subscribe, getPreference, () => "eastern" as const);
  const localTimeZone = useSyncExternalStore(subscribe, getLocalTimeZone, () => EASTERN_TIME_ZONE);
  return {
    preference,
    localTimeZone,
    timeZone: preference === "local" ? localTimeZone : EASTERN_TIME_ZONE,
  };
}

export function TimeZoneSelector({ updatedAt }: { updatedAt: string }) {
  const id = useId();
  const { preference, localTimeZone, timeZone } = useTimeZone();
  return (
    <div className="schedule-controls">
      <span className="update-note">Updated <time dateTime={updatedAt}>{formatKickoff(updatedAt, timeZone)}</time></span>
      <div className="time-zone-control">
        <label htmlFor={id}>Kickoff times</label>
        <select id={id} value={preference} onChange={(event) => setPreference(event.target.value === "local" ? "local" : "eastern")}>
          <option value="eastern">Eastern Time (EDT / EST)</option>
          <option value="local">Your timezone — {timeZoneLabel(localTimeZone)}</option>
        </select>
      </div>
      <p className="time-zone-note">Updates at midnight &amp; noon ET · Scores as of the last update.</p>
      {timeZone !== EASTERN_TIME_ZONE ? <p className="time-zone-note" role="status">Kickoff times use your timezone. NFL schedule dates use Eastern Time.</p> : null}
    </div>
  );
}
