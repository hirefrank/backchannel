import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Clock,
  Trash2,
  Linkedin,
  ChevronRight,
} from "lucide-react";
import * as api from "../lib/api";
import { queryClient } from "../lib/queryClient";
import { CandidateResults } from "./CandidateResults";

interface Candidate {
  id: string;
  name: string | null;
  source: "linkedin" | "resume";
  created_at: string;
}

export function HistoryTab() {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const { data: candidates } = useQuery({
    queryKey: ["candidates"],
    queryFn: api.getCandidates,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      setSelectedCandidateId(null);
    },
  });

  if (selectedCandidateId) {
    return (
      <CandidateResults
        candidateId={selectedCandidateId}
        onBack={() => setSelectedCandidateId(null)}
        backLabel="Back to History"
      />
    );
  }

  return (
    <div className="opacity-0 animate-fade-up">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h3 className="font-medium text-sm">Recent Searches</h3>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">
            {candidates?.length || 0} candidates
          </span>
        </div>

        {!candidates?.length ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-muted)] text-sm">
              No searches yet
            </p>
            <p className="text-[var(--color-text-muted)] text-xs mt-1">
              Analyzed candidates will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {candidates.map((c: Candidate, i: number) => (
              <div
                key={c.id}
                onClick={() => setSelectedCandidateId(c.id)}
                className={`px-5 py-4 flex items-center gap-4 hover:bg-[var(--color-surface-elevated)] transition-colors opacity-0 animate-fade-up stagger-${Math.min(i + 1, 5)} cursor-pointer`}
              >
                <div className="w-10 h-10 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center text-sm font-medium text-[var(--color-text-secondary)]">
                  {c.name?.[0]?.toUpperCase() || "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{c.name || "Unknown"}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {new Date(c.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {c.source === "linkedin" && (
                    <span className="flex items-center gap-1.5 text-xs text-[var(--color-linkedin)]">
                      <Linkedin className="w-3 h-3" />
                    </span>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(c.id);
                    }}
                    className="p-2 rounded-lg hover:bg-[var(--color-danger)]/10 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
