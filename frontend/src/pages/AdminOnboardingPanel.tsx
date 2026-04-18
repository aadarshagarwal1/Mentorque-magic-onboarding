import { useEffect, useState } from "react";
import type { RouteComponentProps } from "wouter";

type Row = {
  onboardingId: string;
  userId: string;
  userName: string;
  revealResume: boolean;
  wildcardLinks: { resumeRevamp: string };
};

type ReviewerRole = "user" | "admin" | "mentor";

export function AdminOnboardingPanel(props: RouteComponentProps<{ token: string }>) {
  const adminToken = props.params.token;
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nameByOnboarding, setNameByOnboarding] = useState<Record<string, string>>({});
  const [roleByOnboarding, setRoleByOnboarding] = useState<Record<string, ReviewerRole>>({});
  const [generated, setGenerated] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/onboarding/admin/${adminToken}/list`);
        const data = await res.json();
        if (!data?.success) throw new Error(data?.message ?? "Failed to load list.");
        if (!cancelled) setItems(data.items ?? []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Load failed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminToken]);

  const generateWildcard = async (onboardingId: string) => {
    const name = nameByOnboarding[onboardingId]?.trim();
    const role = roleByOnboarding[onboardingId] ?? "mentor";
    if (!name) {
      setError("Enter a display name for this wildcard.");
      return;
    }
    setSavingId(onboardingId);
    setError(null);
    try {
      const res = await fetch(`/api/onboarding/admin/${adminToken}/mentor-links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingId, name, role }),
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message ?? "Failed to create link.");
      const path = data.wildcardLink as string;
      const fullUrl = `${window.location.origin}${path}`;
      setGenerated((s) => ({ ...s, [onboardingId]: fullUrl }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
        <p className="text-sm text-zinc-400">Loading onboarding list…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Onboarding admin</h1>
          <p className="mt-1 text-sm text-zinc-400">
            All submissions: onboarding ID, user name, and wildcard links with role + label.
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="px-4 py-3 font-medium">Onboarding ID</th>
                <th className="px-4 py-3 font-medium">User name</th>
                <th className="px-4 py-3 font-medium">Reveal</th>
                <th className="px-4 py-3 font-medium">Resume revamp</th>
                <th className="px-4 py-3 font-medium min-w-[200px]">Wildcard name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    No onboarding submissions yet.
                  </td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.onboardingId} className="border-b border-zinc-800/80 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300 break-all">
                      {it.onboardingId}
                    </td>
                    <td className="px-4 py-3">{it.userName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          it.revealResume
                            ? "rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300"
                            : "rounded-full bg-zinc-700/50 px-2 py-0.5 text-xs text-zinc-400"
                        }
                      >
                        {it.revealResume ? "yes" : "no"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        className="text-sky-400 hover:underline break-all"
                        href={it.wildcardLinks.resumeRevamp}
                      >
                        open
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                        placeholder="Label (e.g. Mentor Jane)"
                        value={nameByOnboarding[it.onboardingId] ?? ""}
                        onChange={(e) =>
                          setNameByOnboarding((s) => ({
                            ...s,
                            [it.onboardingId]: e.target.value,
                          }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                        value={roleByOnboarding[it.onboardingId] ?? "mentor"}
                        onChange={(e) =>
                          setRoleByOnboarding((s) => ({
                            ...s,
                            [it.onboardingId]: e.target.value as ReviewerRole,
                          }))
                        }
                      >
                        <option value="mentor">mentor</option>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={savingId === it.onboardingId}
                        onClick={() => generateWildcard(it.onboardingId)}
                        className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50"
                      >
                        {savingId === it.onboardingId ? "…" : "Generate wildcard"}
                      </button>
                      {generated[it.onboardingId] && (
                        <p className="mt-2 max-w-xs break-all text-xs text-emerald-400/90">
                          {generated[it.onboardingId]}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
