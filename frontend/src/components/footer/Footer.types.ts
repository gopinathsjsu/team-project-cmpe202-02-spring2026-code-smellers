export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterColumn = {
  heading: string;
  links: FooterLink[];
};

export type FooterProps = {
  columns?: FooterColumn[];
};
