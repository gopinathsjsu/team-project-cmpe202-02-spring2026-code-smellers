export type User = {
  name: string;
  avatarUrl?: string;
};

export type NavbarProps = {
  isLoggedIn: boolean;
  /** Location shown in the header; kept in App so Home can reuse the same value for `/api/events?loc=`. */
  browseLocation: string;
  onBrowseLocationChange: (value: string) => void;
  /** Parent decides navigation / side effects; Navbar only collects query + location. */
  onSearch?: (params: { query: string; location: string }) => void;
  user?: User;
};
