export type User = {
  name: string;
  avatarUrl?: string;
};

export type NavbarProps = {
  isLoggedIn: boolean;
  /** Parent decides navigation / side effects; Navbar only collects query + location. */
  onSearch?: (params: { query: string; location: string }) => void;
  user?: User;
};
