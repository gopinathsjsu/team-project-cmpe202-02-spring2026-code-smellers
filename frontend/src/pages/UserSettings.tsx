import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

function initialsForName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() ?? "?";
}

export default function UserSettings() {
  const { user } = useAuth();

  const displayName = useMemo(() => {
    if (!user) return "Account";
    const dn = user.display_name?.trim();
    if (dn) return dn;
    const email = user.email?.trim();
    return email || "Account";
  }, [user]);

  const [draftDisplayName, setDraftDisplayName] = useState(user?.display_name ?? "");
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(true);

  const avatarInitials = useMemo(() => {
    const dn = user?.display_name?.trim();
    if (dn) return initialsForName(dn);
    const email = user?.email?.trim();
    if (email && email.includes("@")) {
      return initialsForName(email.split("@")[0] ?? "");
    }
    return "ED";
  }, [user?.display_name, user?.email]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Settings</p>
        <div className="mt-3 flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-brand-800 text-sm font-bold text-white"
            aria-hidden="true"
          >
            {avatarInitials}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-neutral-900">
            {displayName}
          </h1>
        </div>
      </header>

      <section
        className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-surface-raised"
        style={{ boxShadow: "var(--ds-shadow-card)" }}
        aria-label="Account settings"
      >
        <div className="border-b border-neutral-100 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-neutral-900">Account</h2>
        </div>

        <div className="space-y-6 px-5 py-5">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Profile</h3>

            <div className="mt-3 rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200/70">
              <label className="text-sm font-semibold text-neutral-900" htmlFor="display-name">
                Display name
              </label>
              <input
                id="display-name"
                type="text"
                value={draftDisplayName}
                onChange={(e) => setDraftDisplayName(e.target.value)}
                className="mt-2 w-full rounded-sm border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-500 focus:border-brand-500"
                placeholder="Your name"
              />
              <p className="mt-2 text-xs text-neutral-500">Static for now.</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Email</h3>
            <div className="mt-3 rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200/70">
              <p className="mt-0.5 text-sm text-neutral-600">{user?.email ?? "—"}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Password</h3>
            <div className="mt-3 rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200/70">
              <p className="text-sm font-semibold text-neutral-900">Change password</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  type="password"
                  disabled
                  className="w-full cursor-not-allowed rounded-sm border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-700 outline-none"
                  placeholder="New password"
                />
                <input
                  type="password"
                  disabled
                  className="w-full cursor-not-allowed rounded-sm border border-neutral-300 bg-neutral-100 px-3 py-2 text-sm text-neutral-700 outline-none"
                  placeholder="Confirm password"
                />
              </div>
              <p className="mt-2 text-xs text-neutral-500">Static for now.</p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mt-6 overflow-hidden rounded-2xl border border-neutral-200/80 bg-surface-raised"
        style={{ boxShadow: "var(--ds-shadow-card)" }}
        aria-label="Preference settings"
      >
        <div className="border-b border-neutral-100 px-5 py-4">
          <h2 className="font-display text-lg font-bold text-neutral-900">Preferences</h2>
        </div>
        <div className="space-y-6 px-5 py-5">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
            <div className="mt-3 rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200/70">
              <label className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Email reminders for upcoming events</p>
                  <p className="mt-0.5 text-xs text-neutral-500">Static for now.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailRemindersEnabled}
                  onClick={() => setEmailRemindersEnabled((v) => !v)}
                  className={[
                    "mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                    emailRemindersEnabled
                      ? "border-brand-600 bg-brand-600"
                      : "border-neutral-300 bg-neutral-200",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-fast",
                      emailRemindersEnabled ? "translate-x-5" : "translate-x-0.5",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                </button>
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

