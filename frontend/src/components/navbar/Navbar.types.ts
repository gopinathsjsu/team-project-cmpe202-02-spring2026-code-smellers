export type User = {
  name: string;
  avatarUrl?: string;
};

export type NavbarProps = {
  isLoggedIn: boolean;
  onSearch?: (query: string) => void;
  user?: User;
};
