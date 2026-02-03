import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  Settings,
  Search,
  Clock,
  Zap,
  Network,
  Github,
} from "lucide-react";
import { queryClient } from "./lib/queryClient";
import { SettingsModal } from "./components/SettingsModal";
import { NetworkTab } from "./components/NetworkTab";
import { CheckCandidateTab } from "./components/CheckCandidateTab";
import { HistoryTab } from "./components/HistoryTab";

type TabId = "network" | "check" | "history";

function getTabFromHash(): TabId {
  const hash = window.location.hash.slice(1);
  if (hash === "network" || hash === "check" || hash === "history") {
    return hash;
  }
  return "check";
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="noise-overlay" />
      <MainApp />
    </QueryClientProvider>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState<TabId>(getTabFromHash);
  const [showSettings, setShowSettings] = useState(false);

  // Sync tab with URL hash
  useEffect(() => {
    const handleHashChange = () => setActiveTab(getTabFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const changeTab = (tab: TabId) => {
    window.location.hash = tab;
    setActiveTab(tab);
  };

  // ESC key to close settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showSettings) {
        setShowSettings(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSettings]);

  const tabs = [
    { id: "network", label: "Network", icon: Network, description: "Manage colleagues" },
    { id: "check", label: "Analyze", icon: Search, description: "Check candidates" },
    { id: "history", label: "History", icon: Clock, description: "Past lookups" },
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--color-void)] grid-bg">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-success)] flex items-center justify-center">
              <Zap className="w-5 h-5 text-[var(--color-void)]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Backchannel</h1>
              <p className="text-xs text-[var(--color-text-muted)] font-mono">NETWORK INTEL</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/hirefrank/backchannel"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-text-muted)] transition-all"
            >
              <Github className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </a>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-elevated)] hover:border-[var(--color-text-muted)] transition-all"
            >
              <Settings className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`group relative px-5 py-4 flex items-center gap-3 transition-all ${
                  activeTab === tab.id
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                <tab.icon className={`w-4 h-4 transition-colors ${
                  activeTab === tab.id ? "text-[var(--color-accent)]" : ""
                }`} />
                <span className="font-medium text-sm">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === "network" && <NetworkTab />}
        {activeTab === "check" && <CheckCandidateTab />}
        {activeTab === "history" && <HistoryTab />}
      </main>

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
