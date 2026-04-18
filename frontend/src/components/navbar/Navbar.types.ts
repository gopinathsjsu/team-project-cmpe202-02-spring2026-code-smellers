// No longer need to define User type here since user info is sourced from AuthProvider. Kept here for reference.
// export type User = {
//   name: string;
//   avatarUrl?: string;
// };

export type NavbarProps = {
  /** Location shown in the header; kept in App so Home can reuse the same value for `/api/events?loc=`. */
  browseLocation: string;
  onBrowseLocationChange: (value: string) => void;
  /** Parent decides navigation / side effects; Navbar only collects query + location. */
  onSearch?: (params: { query: string; location: string }) => void;
  // isLoggedIn and user is now sourced from AuthProvider, so we can remove it from props. Kept here for reference.
  // isLoggedIn: boolean;
  // user?: User;
};
