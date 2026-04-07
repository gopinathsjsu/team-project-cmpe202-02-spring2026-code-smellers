import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router";
import { Button } from "../ui/button";
import type { NavbarProps } from "./Navbar.types";

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="9" cy="9" r="5.5" />
      <path d="M13.5 13.5L18 18" strokeLinecap="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M10 17C10 17 15 12.6 15 8.5C15 5.5 12.8 3 10 3C7.2 3 5 5.5 5 8.5C5 12.6 10 17 10 17Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8.2" r="1.8" />
    </svg>
  );
}

function NotificationBellIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        d="M10 2.9C7.86 2.9 6.1 4.66 6.1 6.8V8.88C6.1 10.24 5.61 11.55 4.73 12.58L3.74 13.75C3.47 14.08 3.41 14.53 3.59 14.91C3.77 15.29 4.14 15.53 4.56 15.53H15.44C15.86 15.53 16.23 15.29 16.41 14.91C16.59 14.53 16.53 14.08 16.26 13.75L15.27 12.58C14.39 11.55 13.9 10.24 13.9 8.88V6.8C13.9 4.66 12.14 2.9 10 2.9Z"
      />
      <path d="M8.2 16.1C8.37 17.02 9.1 17.7 10 17.7C10.9 17.7 11.63 17.02 11.8 16.1H8.2Z" />
    </svg>
  );
}

function getInitials(name?: string) {
  if (!name) {
    return "ED";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Navbar({ isLoggedIn, onSearch, user }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("San Jose");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const searchControl = (
    <div className="w-full rounded-sm border border-neutral-300 bg-surface-raised transition-colors duration-fast focus-within:border-brand-500">
      <div className="flex flex-col md:flex-row md:items-center">
        <label className="flex min-w-0 flex-1 items-center px-3 py-1.5">
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search events, artists, venues..."
            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-500"
          />
        </label>

        <div className="border-t border-neutral-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 md:border-t-0 md:border-x">
          in
        </div>

        <label className="flex min-w-0 items-center gap-2 px-3 py-1.5 md:w-56">
          <span className="shrink-0 text-neutral-500">
            <LocationIcon />
          </span>
          <input
            type="text"
            value={locationQuery}
            onChange={(event) => setLocationQuery(event.target.value)}
            placeholder="San Jose"
            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-500"
          />
        </label>

        <div className="flex items-center px-3 py-1.5">
          <Button
            type="button"
            aria-label="Search"
            className="h-7 w-7 shrink-0 !gap-0 !px-0 !py-0 active:bg-brand-800 cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5"
            onClick={() =>
              onSearch?.({ query: searchQuery, location: locationQuery })
            }
          >
            <SearchIcon />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-surface-base">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-3 md:h-16 md:gap-6">
          <div className="shrink-0">
            <Link
              to="/"
              className="font-display text-2xl font-bold tracking-tight text-brand-800 transition-colors duration-fast hover:text-brand-700"
            >
              Eventdull
            </Link>
          </div>

          <div className="hidden flex-1 md:block">{searchControl}</div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-neutral-300 bg-surface-raised text-neutral-700 transition-colors duration-fast hover:border-brand-300 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 md:hidden"
              aria-label={isMobileSearchOpen ? "Close search" : "Open search"}
              aria-expanded={isMobileSearchOpen}
            >
              <SearchIcon />
            </button>

            {isLoggedIn ? (
              <>
                <NavLink to="/CreateEvent">
                  <Button variant="outline" size="sm">Create Event</Button>
                </NavLink>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-brand-700 transition-colors duration-fast hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 cursor-pointer"
                  aria-label="Notifications"
                >
                  <NotificationBellIcon />
                </button>
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-pill bg-brand-800 font-semibold text-white cursor-pointer"
                  aria-label={`Signed in as ${user?.name ?? "Eventdull user"}`}
                  title={user?.name ?? "Eventdull user"}
                >
                  {initials}
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login">
                  <Button variant="outline" size="sm" className="cursor-pointer">Create Event</Button>
                </NavLink>
                <NavLink to="/login">
                  <Button variant="outline" size="sm" className="cursor-pointer">Log in</Button>
                </NavLink>
                <NavLink to="/register">
                  <Button variant="outline" size="sm" className="cursor-pointer">Sign up</Button>
                </NavLink>
              </>
            )}
          </div>
        </div>

        {isMobileSearchOpen ? <div className="pb-3 md:hidden">{searchControl}</div> : null}
      </div>
    </nav>
  );
}

// <Navbar isLoggedIn={false} onSearch={({ query, location }) => ...} />
// <Navbar isLoggedIn={true} user={{ name: "Jane Doe" }} onSearch={({ query, location }) => ...} />
