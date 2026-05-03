import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { Button } from "../ui/button";
import type { NavbarProps } from "./Navbar.types";
import { useAuth } from "../../auth/AuthProvider";

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

function DashboardUserIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="7" r="2.75" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 17v-.5a4 4 0 014-4h3a4 4 0 014 4v.5" />
    </svg>
  );
}

function DashboardOrganizerIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.5" y="4.5" width="13" height="12" rx="1.5" strokeLinejoin="round" />
      <path strokeLinecap="round" d="M3.5 8h13M7 3v3M13 3v3" />
    </svg>
  );
}

function DashboardAdminIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 3.5l6 2.4v5.6c0 3.2-2.5 5.6-6 6.9-3.5-1.3-6-3.7-6-6.9V5.9L10 3.5z" />
    </svg>
  );
}

function SettingsMenuIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="10" r="2.25" />
      <path strokeLinecap="round" d="M10 3.5v1.2M10 15.3V17M16.5 10h-1.2M4.7 10H3.5M14.6 5.4l-.85.85M6.25 13.75l-.85.85M14.6 14.6l-.85-.85M6.25 6.25l-.85-.85" />
    </svg>
  );
}

function LogOutMenuIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 17H5.5A1.5 1.5 0 014 15.5v-11A1.5 1.5 0 015.5 3h2M13 10h-8M11.5 7.5L14 10l-2.5 2.5" />
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

export function Navbar({
  // isLoggedIn, // now uses AuthContext to determine auth status
  // user, // also uses AuthContext for user info
  browseLocation,
  onBrowseLocationChange,
  onSearch,
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationInput, setLocationInput] = useState(browseLocation);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [isDashboardMenuOpen, setIsDashboardMenuOpen] = useState(false);
  const dashboardMenuRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();

  /** Same width rules for dashboard + profile menus: shrink to content, shared max for long names. */
  const navDropdownPanelClass =
    "absolute right-0 top-full z-50 mt-2 w-max min-w-0 max-w-[14.5rem] overflow-hidden rounded-lg border border-neutral-200 bg-surface-raised py-1.5 shadow-soft";

  // const initials = useMemo(() => getInitials(user?.name), [user?.name]);
  const initials = useMemo(
    () => getInitials(user?.display_name),
    [user?.display_name],
  );

  // Close profile menu when clicking outside. Anyone got a better way to do this without a library?
  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  // Close dashboard dropdown when clicking outside.
  useEffect(() => {
    if (!isDashboardMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        dashboardMenuRef.current &&
        !dashboardMenuRef.current.contains(event.target as Node)
      ) {
        setIsDashboardMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDashboardMenuOpen]);

  useEffect(() => {
    setLocationInput(browseLocation);
  }, [browseLocation]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    navigate("/");
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
            value={locationInput}
            onChange={(event) => setLocationInput(event.target.value)}
            placeholder="San Jose"
            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-500"
          />
        </label>

        <div className="flex items-center px-3 py-1.5">
          <Button
            type="button"
            aria-label="Search"
            className="h-7 w-7 shrink-0 !gap-0 !px-0 !py-0 active:bg-brand-800 cursor-pointer [&_svg]:h-3.5 [&_svg]:w-3.5"
            onClick={() => {
              onBrowseLocationChange(locationInput);
              onSearch?.({ query: searchQuery, location: locationInput });
            }}
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

            {status === "authenticated" ? (
              <>
                <NavLink to="/CreateEvent">
                  <Button variant="outline" size="sm">
                    Create Event
                  </Button>
                </NavLink>

                {/* Dashboard Dropdown */}
                <div className="relative" ref={dashboardMenuRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDashboardMenuOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={isDashboardMenuOpen}
                    className={`flex items-center gap-1 cursor-pointer ${isDashboardMenuOpen ? "border-brand-500 bg-brand-50 text-brand-800" : ""}`}
                  >
                    Dashboard
                    <svg
                      className={`h-3.5 w-3.5 shrink-0 text-current opacity-70 transition-transform duration-fast ${isDashboardMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Button>

                  {isDashboardMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Dashboard destinations"
                      className={navDropdownPanelClass}
                    >
                      <div className="flex flex-col gap-0.5 px-1.5">
                        <NavLink
                          role="menuitem"
                          to="/dashboard-user"
                          className={({ isActive }) =>
                            [
                              "group flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm font-medium transition-colors duration-fast outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-0",
                              isActive
                                ? "bg-brand-50 text-brand-900"
                                : "text-neutral-700 hover:bg-brand-50/90 hover:text-brand-900",
                            ].join(" ")
                          }
                          onClick={() => setIsDashboardMenuOpen(false)}
                        >
                          <DashboardUserIcon className="h-4 w-4 shrink-0 text-brand-600 opacity-90 group-hover:opacity-100" />
                          <span className="min-w-0 flex-1 leading-snug">User Dashboard</span>
                        </NavLink>
                        <NavLink
                          role="menuitem"
                          to="/dashboard-organizer"
                          className={({ isActive }) =>
                            [
                              "group flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm font-medium transition-colors duration-fast outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-0",
                              isActive
                                ? "bg-brand-50 text-brand-900"
                                : "text-neutral-700 hover:bg-brand-50/90 hover:text-brand-900",
                            ].join(" ")
                          }
                          onClick={() => setIsDashboardMenuOpen(false)}
                        >
                          <DashboardOrganizerIcon className="h-4 w-4 shrink-0 text-brand-600 opacity-90 group-hover:opacity-100" />
                          <span className="min-w-0 flex-1 leading-snug">Organizer Dashboard</span>
                        </NavLink>
                        {user?.is_admin ? (
                          <>
                            <div className="mx-1.5 my-1 h-px bg-neutral-100" aria-hidden />
                            <NavLink
                              role="menuitem"
                              to="/dashboard-admin"
                              className={({ isActive }) =>
                                [
                                  "group flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm font-semibold transition-colors duration-fast outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-0",
                                  isActive
                                    ? "bg-brand-100 text-brand-900"
                                    : "text-brand-800 hover:bg-brand-50 hover:text-brand-950",
                                ].join(" ")
                              }
                              onClick={() => setIsDashboardMenuOpen(false)}
                            >
                              <DashboardAdminIcon className="h-4 w-4 shrink-0 text-brand-700 opacity-90 group-hover:opacity-100" />
                              <span className="min-w-0 flex-1 leading-snug">Admin Dashboard</span>
                            </NavLink>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen((open) => !open)}
                    className={[
                      "inline-flex h-8 w-8 items-center justify-center rounded-pill bg-brand-800 text-xs font-semibold text-white cursor-pointer transition-shadow duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                      isProfileMenuOpen ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-surface-base" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-label={`Signed in as ${user?.display_name ?? "Eventdull user"}`}
                    aria-haspopup="menu"
                    aria-expanded={isProfileMenuOpen}
                    title={user?.display_name ?? "Eventdull user"}
                  >
                    {initials}
                  </button>

                  {isProfileMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Account menu"
                      className={navDropdownPanelClass}
                    >
                      <div className="border-b border-neutral-100 px-3 py-2">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {user?.display_name || "Account"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-0.5 px-1.5 pt-1.5">
                        <NavLink
                          role="menuitem"
                          to="/settings"
                          className={({ isActive }) =>
                            [
                              "group flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm font-medium transition-colors duration-fast outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-0",
                              isActive
                                ? "bg-brand-50 text-brand-900"
                                : "text-neutral-700 hover:bg-brand-50/90 hover:text-brand-900",
                            ].join(" ")
                          }
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <SettingsMenuIcon className="h-4 w-4 shrink-0 text-brand-600 opacity-90 group-hover:opacity-100" />
                          <span className="min-w-0 flex-1 leading-snug">Settings</span>
                        </NavLink>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="group flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-sm font-medium text-error-600 transition-colors duration-fast outline-none hover:bg-error-50 hover:text-error-700 focus-visible:ring-2 focus-visible:ring-error-500 focus-visible:ring-offset-0"
                        >
                          <LogOutMenuIcon className="h-4 w-4 shrink-0 text-error-500 opacity-90 group-hover:opacity-100" />
                          <span className="min-w-0 flex-1 leading-snug">Log out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : status === "unauthenticated" ? (
              <>
                <NavLink to="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    Create Event
                  </Button>
                </NavLink>
                <NavLink to="/login" state={{ from: location.pathname }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    Log in
                  </Button>
                </NavLink>
                <NavLink to="/register">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    Sign up
                  </Button>
                </NavLink>
              </>
            ) : null}
          </div>
        </div>

        {isMobileSearchOpen ? (
          <div className="pb-3 md:hidden">{searchControl}</div>
        ) : null}
      </div>
    </nav>
  );
}

// <Navbar browseLocation={loc} onBrowseLocationChange={setLoc} isLoggedIn={false} onSearch={...} />
