import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Briefcase,
  Calendar,
  ExternalLink,
  Loader2,
} from "lucide-react";
import * as api from "../lib/api";

interface WorkHistory {
  id: string;
  company_name: string;
  title: string | null;
  start_year: number | null;
  start_month: number | null;
  end_year: number | null;
  end_month: number | null;
  is_current: number;
}

interface ColleagueDetailProps {
  colleagueId: string;
  onClose: () => void;
}

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(year: number | null, month: number | null): string {
  if (!year) return "";
  if (!month) return String(year);
  return `${MONTHS[month]} ${year}`;
}

function formatDateRange(wh: WorkHistory): string {
  const start = formatDate(wh.start_year, wh.start_month);
  const end = wh.is_current ? "Present" : formatDate(wh.end_year, wh.end_month);

  if (!start && !end) return "";
  if (!start) return end;
  if (!end) return start;
  return `${start} - ${end}`;
}

export function ColleagueDetail({ colleagueId, onClose }: ColleagueDetailProps) {
  const { data: colleague, isLoading } = useQuery({
    queryKey: ["colleague", colleagueId],
    queryFn: () => api.getColleague(colleagueId),
  });

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center text-lg font-medium text-[var(--color-text-secondary)]">
              {colleague?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{colleague?.name || "Loading..."}</h2>
              {colleague?.current_title && (
                <p className="text-sm text-[var(--color-text-muted)]">{colleague.current_title}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* LinkedIn Link */}
              {colleague?.linkedin_url && (
                <a
                  href={colleague.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[var(--color-accent)] hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  View LinkedIn Profile
                </a>
              )}

              {/* Work History */}
              <div>
                <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Work History
                </h3>

                {!colleague?.work_history?.length ? (
                  <div className="text-center py-8 text-[var(--color-text-muted)]">
                    <p className="text-sm">No work history available</p>
                    <p className="text-xs mt-1">Enrich this profile to fetch work history</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {colleague.work_history.map((wh: WorkHistory, index: number) => (
                      <div
                        key={wh.id}
                        className="relative pl-6 pb-4"
                      >
                        {/* Timeline line */}
                        {index < colleague.work_history.length - 1 && (
                          <div className="absolute left-[7px] top-3 bottom-0 w-px bg-[var(--color-border)]" />
                        )}

                        {/* Timeline dot */}
                        <div className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 ${
                          wh.is_current
                            ? "bg-[var(--color-success)] border-[var(--color-success)]"
                            : "bg-[var(--color-surface)] border-[var(--color-border)]"
                        }`} />

                        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-4">
                          <p className="font-medium text-sm">{wh.company_name}</p>
                          {wh.title && (
                            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{wh.title}</p>
                          )}
                          {(wh.start_year || wh.is_current) && (
                            <p className="text-xs text-[var(--color-text-muted)] mt-2 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateRange(wh)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Metadata */}
              {colleague?.enriched_at && (
                <div className="pt-4 border-t border-[var(--color-border)]">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Last enriched: {new Date(colleague.enriched_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
