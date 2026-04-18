import { useState } from "react";
import type { RouteComponentProps } from "wouter";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";

const LS_ACCESS_TOKEN = "onboardingAccessToken";
const LS_ACCESS_PAYLOAD = "onboardingAccessPayload";

export function MentorClaimPage(props: RouteComponentProps<{ inviteToken: string }>) {
  const inviteToken = props.params.inviteToken;
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onClaim = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const syncRes = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!syncRes.ok) throw new Error("Auth sync failed.");
      const syncData = await syncRes.json();
      setAuth(syncData.user, idToken);

      const res = await fetch("/api/onboarding/mentor/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteToken,
          userId: syncData.user.id,
          name: syncData.user.name ?? syncData.user.email ?? "User",
        }),
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message ?? "Claim failed.");

      localStorage.setItem(LS_ACCESS_TOKEN, data.token);
      localStorage.setItem(LS_ACCESS_PAYLOAD, JSON.stringify(data.payload));
      window.location.href = "/resume-revamp";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center space-y-4">
        <h1 className="text-xl font-semibold">Access link</h1>
        <p className="text-sm text-zinc-400">
          Sign in with Google to activate this wildcard and open the resume flow.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={onClaim}
          disabled={loading}
          className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {loading ? "Working…" : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
