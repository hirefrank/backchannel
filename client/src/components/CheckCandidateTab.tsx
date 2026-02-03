import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Search,
  AlertTriangle,
  Loader2,
  Linkedin,
} from "lucide-react";
import * as api from "../lib/api";
import { isValidLinkedInUrl, normalizeLinkedInUrl } from "../lib/linkedin";
import { CandidateResults } from "./CandidateResults";

export function CheckCandidateTab() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const candidateMutation = useMutation({
    mutationFn: api.createCandidate,
    onSuccess: (data) => setCandidateId(data.id),
  });

  const validateAndSubmit = () => {
    if (!linkedinUrl) {
      setUrlError("Please enter a LinkedIn URL");
      return;
    }

    const normalized = normalizeLinkedInUrl(linkedinUrl);
    if (!isValidLinkedInUrl(normalized)) {
      setUrlError("Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/username)");
      return;
    }

    setUrlError(null);
    candidateMutation.mutate(normalized);
  };

  if (candidateId) {
    return <CandidateResults candidateId={candidateId} onBack={() => {
      setCandidateId(null);
      setLinkedinUrl("");
      setUrlError(null);
    }} backLabel="New Search" />;
  }

  return (
    <div className="max-w-2xl mx-auto opacity-0 animate-fade-up">
      {/* Hero Input Section */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold mb-2">Find Your Connection</h2>
        <p className="text-[var(--color-text-muted)]">
          Discover who in your network has worked with a candidate
        </p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        {/* Input Area */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Linkedin className="w-5 h-5 text-[var(--color-linkedin)]" />
              </div>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => { setLinkedinUrl(e.target.value); setUrlError(null); }}
                placeholder="https://linkedin.com/in/username"
                className={`w-full pl-12 pr-4 py-4 rounded-lg text-base ${urlError ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]' : ''}`}
                onKeyDown={(e) => e.key === "Enter" && validateAndSubmit()}
              />
            </div>
            {urlError && (
              <p className="text-xs text-[var(--color-danger)] flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                {urlError}
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="px-6 pb-6">
          <button
            onClick={validateAndSubmit}
            disabled={candidateMutation.isPending || !linkedinUrl}
            className="w-full py-4 rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-success)] text-[var(--color-void)] font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all gradient-border"
          >
            {candidateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Find Connections
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
