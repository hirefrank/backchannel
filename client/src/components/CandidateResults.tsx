import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Check,
  ExternalLink,
  ChevronRight,
  Building2,
  Calendar,
  Mail,
  Linkedin,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";
import * as api from "../lib/api";

interface Overlap {
  colleague: {
    id: string;
    name: string;
    linkedin_url: string | null;
    profile_image_url: string | null;
    current_title: string | null;
  };
  company?: string;
  school?: string;
  type: "work" | "education";
  overlap_months?: number;
  overlap_years?: number;
  overlap_period: { start: string; end: string } | null;
}

interface CandidateResultsProps {
  candidateId: string;
  onBack: () => void;
  backLabel?: string;
}

export function CandidateResults({ candidateId, onBack, backLabel = "New Search" }: CandidateResultsProps) {
  const { data: candidate, isLoading } = useQuery({
    queryKey: ["candidate", candidateId],
    queryFn: () => api.getCandidate(candidateId),
  });

  const { data: overlaps, isLoading: loadingOverlaps } = useQuery({
    queryKey: ["overlaps", candidateId],
    queryFn: () => api.getCandidateOverlaps(candidateId),
  });

  if (isLoading || loadingOverlaps) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-[var(--color-accent)]/20" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        </div>
        <p className="mt-6 text-[var(--color-text-secondary)] font-medium">Scanning network...</p>
        <p className="text-sm text-[var(--color-text-muted)]">Finding overlapping connections</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 opacity-0 animate-fade-up">
      {/* Candidate Header */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {candidate?.profile_image_url ? (
              <img
                src={candidate.profile_image_url}
                alt=""
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-success)] flex items-center justify-center text-xl font-semibold text-[var(--color-void)]">
                {candidate?.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{candidate?.name || "Unknown Candidate"}</h2>
              <div className="flex items-center gap-2 mt-1">
                {candidate?.source === "linkedin" && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-linkedin)]">
                    <Linkedin className="w-3 h-3" />
                    LinkedIn verified
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-surface-elevated)] transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {backLabel}
          </button>
        </div>
      </div>

      {/* Results Container */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        {/* Results Summary */}
        <div className={`flex items-center gap-4 p-5 border-b border-[var(--color-border)] ${
          overlaps?.length ? "bg-[var(--color-success)]/5" : ""
        }`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            overlaps?.length
              ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
              : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]"
          }`}>
            {overlaps?.length ? (
              <Check className="w-6 h-6" />
            ) : (
              <Search className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="font-semibold">
              {overlaps?.length
                ? `${overlaps.length} connection${overlaps.length > 1 ? "s" : ""} found`
                : "No connections found"
              }
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              {overlaps?.length
                ? "People in your network who worked at the same companies"
                : "No overlapping work history found. Have you enriched your colleagues?"
              }
            </p>
          </div>
        </div>

        {/* Overlaps List */}
        {overlaps && overlaps.length > 0 && (
          <div className="divide-y divide-[var(--color-border)]">
          {overlaps.map((overlap: Overlap, i: number) => (
            <div
              key={i}
              className={`p-5 hover:bg-[var(--color-surface-elevated)] transition-all opacity-0 animate-fade-up stagger-${Math.min(i + 1, 5)}`}
            >
              <div className="flex items-start gap-4">
                {overlap.colleague.profile_image_url ? (
                  <img
                    src={overlap.colleague.profile_image_url}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center text-lg font-medium text-[var(--color-text-secondary)]">
                    {overlap.colleague.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{overlap.colleague.name}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {overlap.colleague.current_title}
                      </p>
                    </div>

                    {overlap.colleague.linkedin_url && (
                      <a
                        href={overlap.colleague.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium hover:bg-[var(--color-surface-elevated)] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        LinkedIn
                      </a>
                    )}
                  </div>

                  {/* Overlap Details */}
                  <div className="mt-4 p-4 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-2 mb-2">
                      {overlap.type === "education" ? (
                        <>
                          <GraduationCap className="w-4 h-4 text-[var(--color-success)]" />
                          <span className="font-medium text-sm">{overlap.school}</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="w-4 h-4 text-[var(--color-accent)]" />
                          <span className="font-medium text-sm">{overlap.company}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                      {overlap.overlap_period ? (
                        <>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {overlap.overlap_period.start} → {overlap.overlap_period.end}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            overlap.type === "education"
                              ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                              : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                          }`}>
                            {overlap.type === "education"
                              ? `${overlap.overlap_years} year${(overlap.overlap_years ?? 0) > 1 ? "s" : ""} overlap`
                              : `${overlap.overlap_months} month${(overlap.overlap_months ?? 0) > 1 ? "s" : ""} overlap`
                            }
                          </span>
                        </>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-medium bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
                          Worked at same company (dates unknown)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <a
                      href={`mailto:?subject=Quick question about ${candidate?.name || "a candidate"}&body=Hi ${overlap.colleague.name?.split(" ")[0]},`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-void)] text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Mail className="w-4 h-4" />
                      Draft Email
                    </a>
                    <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <span className="text-xs text-[var(--color-text-muted)]">
                      Ask about their experience working together
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
