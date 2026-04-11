export default function DashboardOrganizer() {
  return (
    <div className="bg-surface-base">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="rounded-xl border border-neutral-200 bg-surface-raised p-4 shadow-soft lg:sticky lg:top-24 lg:h-fit">
          <p className="font-display text-2xl font-bold text-neutral-900">Organizer</p>
          <p className="mt-1 text-sm text-neutral-500">Studio Team</p>

          <nav className="mt-6 space-y-2 text-sm font-semibold">
            <a className="block rounded-sm bg-brand-50 px-3 py-2 text-brand-800" href="#overview">
              Home
            </a>
            <a className="block rounded-sm px-3 py-2 text-neutral-700 transition-colors duration-fast hover:bg-neutral-100" href="#create-event">
              Create Event
            </a>
            <a className="block rounded-sm px-3 py-2 text-neutral-700 transition-colors duration-fast hover:bg-neutral-100" href="#orders">
              RSVP / Orders
            </a>
            <a className="block rounded-sm px-3 py-2 text-neutral-700 transition-colors duration-fast hover:bg-neutral-100" href="#settings">
              Settings
            </a>
          </nav>
        </aside>

        <section id="overview" className="space-y-6">
          <header className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Organizer Dashboard</p>
                <h1 className="mt-1 font-display text-3xl font-bold text-neutral-900">Event performance at a glance</h1>
              </div>
              <button
                id="create-event"
                type="button"
                className="rounded-sm bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-fast hover:bg-brand-700"
              >
                + Create event
              </button>
            </div>
          </header>

          <section className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
            <h2 className="font-display text-2xl font-semibold text-neutral-900">Current Events</h2>
            <p className="mt-3 text-sm text-neutral-600">Event cards will be added in the next commit.</p>
          </section>

          <section id="orders" className="rounded-xl border border-neutral-200 bg-surface-raised p-6 shadow-soft">
            <h2 className="font-display text-2xl font-semibold text-neutral-900">Past Events</h2>
            <p className="mt-3 text-sm text-neutral-600">Past event cards will be added in the next commit.</p>
          </section>

          <section id="settings" className="rounded-xl border border-dashed border-neutral-300 bg-surface-subtle p-6 text-sm text-neutral-600">
            Settings and organizer account preferences can go here.
          </section>
        </section>
      </div>
    </div>
  );
}
