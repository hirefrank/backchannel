import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Settings,
  Building2,
  Linkedin,
  Zap,
  Check,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import * as api from "../lib/api";
import { queryClient } from "../lib/queryClient";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.fetchSettings,
  });

  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      api.updateSetting(key, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  const testSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings/test-linkedin', { method: 'POST' });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl w-full max-w-md overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center">
              <Settings className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <h2 className="font-semibold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-elevated)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--color-text-muted)]" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
              <Building2 className="w-3.5 h-3.5" />
              Current Company
            </label>
            <input
              type="text"
              defaultValue={settings?.current_company || ""}
              onBlur={(e) => mutation.mutate({ key: "current_company", value: e.target.value })}
              className="w-full px-4 py-3 rounded-lg"
              placeholder="e.g., Shopify"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Filter imported connections by company
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
              <Linkedin className="w-3.5 h-3.5" />
              LinkedIn Session Cookie
              {settings?.linkedin_session_valid === true && (
                <span className="flex items-center gap-1 text-xs text-[var(--color-success)]">
                  <Check className="w-3 h-3" /> Valid
                </span>
              )}
              {settings?.linkedin_session_valid === false && (
                <span className="flex items-center gap-1 text-xs text-[var(--color-warning)]">
                  <AlertTriangle className="w-3 h-3" /> Expired
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                defaultValue={settings?.li_at_cookie || ""}
                onBlur={(e) => mutation.mutate({ key: "li_at_cookie", value: e.target.value })}
                className="flex-1 px-4 py-3 rounded-lg"
                placeholder="AQFA..."
              />
              <button
                onClick={() => testSessionMutation.mutate()}
                disabled={testSessionMutation.isPending}
                className="px-4 py-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-elevated)] transition-colors text-sm"
              >
                {testSessionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Test"
                )}
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Get from browser DevTools → Application → Cookies → li_at
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
              <Zap className="w-3.5 h-3.5" />
              Rate Limit (ms)
            </label>
            <input
              type="number"
              defaultValue={settings?.rate_limit_ms || "2000"}
              onBlur={(e) => mutation.mutate({ key: "rate_limit_ms", value: e.target.value })}
              className="w-full px-4 py-3 rounded-lg"
              placeholder="2000"
            />
            <p className="text-xs text-[var(--color-text-muted)]">
              Delay between LinkedIn requests (default: 2000ms)
            </p>
          </div>

          {/* AI Provider Section */}
          <div className="pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="text-sm font-medium">AI Provider</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
                via AI SDK
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-[var(--color-text-secondary)]">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  defaultValue={settings?.gemini_api_key || ""}
                  onBlur={(e) => mutation.mutate({ key: "gemini_api_key", value: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg"
                  placeholder="AIza..."
                />
                <p className="text-xs text-[var(--color-text-muted)]">
                  Get from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Google AI Studio</a>
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[var(--color-text-secondary)]">
                  Model
                </label>
                <input
                  type="text"
                  defaultValue={settings?.ai_model || "gemini-3-flash-preview"}
                  onBlur={(e) => mutation.mutate({ key: "ai_model", value: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg"
                  placeholder="gemini-3-flash-preview"
                />
                <p className="text-xs text-[var(--color-text-muted)]">
                  Uses @ai-sdk/google for inference
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[var(--color-surface-elevated)] border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-void)] font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
