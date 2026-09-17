"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(() => typeof window !== "undefined" && (
    window.matchMedia("(display-mode: standalone)").matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  ));
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        setAnnouncement("Install support is temporarily unavailable.");
      });
    }

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setShowHelp(false);
      setAnnouncement("Who Plays Tonight was installed.");
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (!promptEvent) {
      setShowHelp((current) => !current);
      setAnnouncement("Use your browser menu and choose Install app or Add to Home Screen.");
      return;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    setAnnouncement(choice.outcome === "accepted" ? "Installation started." : "Installation canceled.");
  }

  if (installed) return <span className="installed-badge" aria-label="App installed">Installed</span>;

  return (
    <div className="install-wrap">
      <button
        type="button"
        className="install-button"
        onClick={install}
        aria-expanded={showHelp}
        aria-controls="install-help"
      >
        <span aria-hidden="true">↓</span> Install app
      </button>
      {showHelp ? <p className="install-help" id="install-help">Open your browser menu, then choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</p> : null}
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    </div>
  );
}
