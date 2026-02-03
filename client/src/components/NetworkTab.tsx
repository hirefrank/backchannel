import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Upload,
  Users,
  Check,
  Clock,
  Loader2,
  Trash2,
  Sparkles,
  Zap,
  Square,
} from "lucide-react";
import * as api from "../lib/api";
import { queryClient } from "../lib/queryClient";
import { StatCard } from "./StatCard";
import { ColleagueDetail } from "./ColleagueDetail";

interface Colleague {
  id: string;
  name: string;
  current_title: string | null;
  enriched_at: string | null;
}

interface QueueState {
  current: number;
  total: number;
  currentName: string;
}

export function NetworkTab() {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [selectedColleagueId, setSelectedColleagueId] = useState<string | null>(null);
  const abortRef = useRef(false);

  const { data: colleagues } = useQuery({
    queryKey: ["colleagues"],
    queryFn: api.getColleagues,
  });

  const importMutation = useMutation({
    mutationFn: api.importColleagues,
    onSuccess: () => {
      setImportFile(null);
      queryClient.invalidateQueries({ queryKey: ["colleagues"] });
    },
  });

  const enrichMutation = useMutation({
    mutationFn: api.enrichColleague,
    onSuccess: () => {
      setEnrichingId(null);
      queryClient.invalidateQueries({ queryKey: ["colleagues"] });
    },
    onError: () => {
      setEnrichingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteColleague,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["colleagues"] }),
  });

  const handleEnrich = (id: string) => {
    setEnrichingId(id);
    enrichMutation.mutate(id);
  };

  const handleEnrichAll = async () => {
    const pending = colleagues?.filter((c: Colleague) => !c.enriched_at) || [];
    if (pending.length === 0) return;

    abortRef.current = false;

    for (let i = 0; i < pending.length; i++) {
      if (abortRef.current) break;

      const colleague = pending[i];
      setQueueState({ current: i + 1, total: pending.length, currentName: colleague.name });
      setEnrichingId(colleague.id);

      try {
        await api.enrichColleague(colleague.id);
        queryClient.invalidateQueries({ queryKey: ["colleagues"] });
      } catch (err) {
        console.error(`Failed to enrich ${colleague.name}:`, err);
      }
    }

    setQueueState(null);
    setEnrichingId(null);
  };

  const handleStopEnrichAll = () => {
    abortRef.current = true;
  };

  const enrichedCount = colleagues?.filter((c: Colleague) => c.enriched_at).length || 0;
  const pendingCount = (colleagues?.length || 0) - enrichedCount;

  // Zero state - no colleagues yet
  if (!colleagues?.length) {
    return (
      <div className="max-w-xl mx-auto opacity-0 animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[var(--color-text-muted)]" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Import Your Network</h2>
          <p className="text-[var(--color-text-muted)]">
            Upload your LinkedIn connections to get started
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                <button
                  onClick={() => importFile && importMutation.mutate(importFile)}
                  disabled={!importFile || importMutation.isPending}
                  className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-void)] font-medium text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {importMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Import
                </button>
              </div>

              {importMutation.data && (
                <div className="px-4 py-3 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-sm">
                  <span className="text-[var(--color-success)]">
                    Imported {importMutation.data.imported} colleagues
                  </span>
                  {importMutation.data.skipped > 0 && (
                    <span className="text-[var(--color-text-muted)]">
                      {" "}· {importMutation.data.skipped} skipped (duplicates)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-[var(--color-surface-elevated)] border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              Export from LinkedIn: Settings → Data Privacy → Get a copy of your data → Connections
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 opacity-0 animate-fade-up">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Total Colleagues"
          value={colleagues?.length || 0}
          icon={Users}
          color="accent"
        />
        <StatCard
          label="Enriched"
          value={enrichedCount}
          icon={Check}
          color="success"
        />
        <StatCard
          label="Pending"
          value={pendingCount}
          icon={Clock}
          color="warning"
        />
      </div>

      {/* Import Success Message */}
      {importMutation.data && (
        <div className="px-4 py-3 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-sm">
          <span className="text-[var(--color-success)]">
            Imported {importMutation.data.imported} colleagues
          </span>
          {importMutation.data.skipped > 0 && (
            <span className="text-[var(--color-text-muted)]">
              {" "}· {importMutation.data.skipped} skipped (duplicates)
            </span>
          )}
        </div>
      )}

      {/* Enrichment Status */}
      {enrichingId && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-accent)]" />
            <span className="text-sm text-[var(--color-accent)]">
              {queueState
                ? `Enriching ${queueState.current} of ${queueState.total}: ${queueState.currentName}...`
                : "Enriching profile... This may take up to 30 seconds."}
            </span>
          </div>
          {queueState && (
            <button
              onClick={handleStopEnrichAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-xs font-medium hover:bg-[var(--color-danger)]/20 transition-colors"
            >
              <Square className="w-3 h-3" />
              Stop
            </button>
          )}
        </div>
      )}

      {/* Colleagues Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="font-medium text-sm">Your Network</h3>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-surface-elevated)] transition-colors cursor-pointer">
              <Upload className="w-3 h-3" />
              Import
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    importMutation.mutate(file);
                    e.target.value = '';
                  }
                }}
                className="hidden"
              />
            </label>
            {pendingCount > 0 && (
              <button
                onClick={handleEnrichAll}
                disabled={!!enrichingId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-void)] text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Zap className="w-3 h-3" />
                Enrich All ({pendingCount})
              </button>
            )}
            <span className="text-xs font-mono text-[var(--color-text-muted)]">
              {colleagues?.length || 0} people
            </span>
          </div>
        </div>

        {colleagues?.length > 0 && (
          <div className="divide-y divide-[var(--color-border)]">
            {colleagues.map((c: Colleague, i: number) => (
              <div
                key={c.id}
                className={`px-5 py-4 flex items-center gap-4 hover:bg-[var(--color-surface-elevated)] transition-colors opacity-0 animate-fade-up stagger-${Math.min(i + 1, 5)} cursor-pointer`}
                onClick={() => setSelectedColleagueId(c.id)}
              >
                <div className="w-10 h-10 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center text-sm font-medium text-[var(--color-text-secondary)]">
                  {c.name?.[0]?.toUpperCase() || "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    {c.current_title || "No title"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {c.enriched_at ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] text-xs font-medium">
                      <div className="status-dot online" />
                      Enriched
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-warning)]/10 text-[var(--color-warning)] text-xs font-medium">
                      <div className="status-dot pending" />
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {!c.enriched_at && (
                    <button
                      onClick={() => handleEnrich(c.id)}
                      disabled={!!enrichingId}
                      className={`p-2 rounded-lg transition-colors ${
                        enrichingId && enrichingId !== c.id
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      }`}
                      title={enrichingId === c.id ? "Enriching profile..." : "Enrich profile"}
                    >
                      {enrichingId === c.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--color-accent)]" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(c.id)}
                    className="p-2 rounded-lg hover:bg-[var(--color-danger)]/10 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedColleagueId && (
        <ColleagueDetail
          colleagueId={selectedColleagueId}
          onClose={() => setSelectedColleagueId(null)}
        />
      )}
    </div>
  );
}
