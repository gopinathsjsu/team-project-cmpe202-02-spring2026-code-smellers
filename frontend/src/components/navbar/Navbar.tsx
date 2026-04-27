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
  const location = useLocation();
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();

  // const initials = useMemo(() => getInitials(user?.name), [user?.name]);
  const initials = useMemo(
    () => getInitials(user?.display_name),
    [user?.display_name],
  );

  const dashboardPath = useMemo(() => {
    if (user?.is_admin) {
      return "/dashboard-admin";
    }
    return "/dashboard-user";
  }, [user?.is_admin]);

  // Close profile menu when clicking outside. Anyone got a better way to do this without a library?
  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    useEffect(() => {
      setLocationInput(browseLocation);
    }, [browseLocation]);

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
                <NavLink to={dashboardPath}>
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </NavLink>
                <div className="relative" ref={profileMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsProfileMenuOpen((open) => !open)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-pill bg-brand-800 text-xs font-semibold text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
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
                      className="absolute right-0 top-10 z-50 min-w-[10rem] overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-sm transition-colors hover:bg-neutral-50 cursor-pointer"
                      >
                        Log out
                      </button>
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
