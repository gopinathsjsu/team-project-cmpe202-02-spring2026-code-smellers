import type { ReactNode } from "react";
import { Link } from "react-router";
import type { FooterColumn, FooterLink, FooterProps } from "./Footer.types";

const defaultColumns: FooterColumn[] = [
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Press", href: "/press" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Contact Us", href: "/contact" },
      { label: "Accessibility", href: "/accessibility" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
  {
    heading: "Explore",
    links: [
      { label: "Browse Events", href: "/events" },
      { label: "Create an Event", href: "/create" },
      { label: "Pricing", href: "/pricing" },
      { label: "Gift Cards", href: "/gift-cards" },
    ],
  },
];

type SocialIconProps = {
  label: string;
  children: ReactNode;
};

function SocialLink({ label, children }: SocialIconProps) {
  return (
    <a
      href="#"
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-pill text-neutral-300 transition-colors duration-fast hover:bg-white/5 hover:text-white"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="flex h-5 w-5 items-center justify-center">{children}</span>
    </a>
  );
}

function FooterNavLink({ link }: { link: FooterLink }) {
  const className =
    "text-sm text-neutral-300 transition-all duration-fast hover:text-white hover:underline";

  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label}
      </a>
    );
  }

  return (
    <Link to={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export function Footer({ columns = defaultColumns }: FooterProps) {
  return (
    <footer className="mt-auto w-full bg-surface-dark text-neutral-200">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.25fr_repeat(3,minmax(0,1fr))] lg:px-8">
        <div className="max-w-sm">
          <Link
            to="/"
            className="font-display text-2xl font-bold tracking-tight text-brand-300 transition-colors duration-fast hover:text-brand-200"
          >
            Evently
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">
            Discover and create events that matter.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.heading}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-accent-400">
              {column.heading}
            </h2>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={`${column.heading}-${link.label}`}>
                  <FooterNavLink link={link} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-800">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p className="text-sm text-neutral-400">© 2025 Evently. All rights reserved.</p>

          <div className="flex items-center gap-2">
            <SocialLink label="Twitter">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2H21.5l-7.113 8.13L22.75 22h-6.548l-5.126-7.3L4.687 22H1.43l7.604-8.688L1 2h6.714l4.634 6.594L18.244 2Z" />
              </svg>
            </SocialLink>
            <SocialLink label="Instagram">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7.25 2h9.5A5.25 5.25 0 0 1 22 7.25v9.5A5.25 5.25 0 0 1 16.75 22h-9.5A5.25 5.25 0 0 1 2 16.75v-9.5A5.25 5.25 0 0 1 7.25 2Zm0 1.75A3.5 3.5 0 0 0 3.75 7.25v9.5a3.5 3.5 0 0 0 3.5 3.5h9.5a3.5 3.5 0 0 0 3.5-3.5v-9.5a3.5 3.5 0 0 0-3.5-3.5h-9.5Zm9.875 1.5a1.125 1.125 0 1 1 0 2.25 1.125 1.125 0 0 1 0-2.25ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z" />
              </svg>
            </SocialLink>
            <SocialLink label="Facebook">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13.64 22v-8.04h2.7l.4-3.14h-3.1V8.82c0-.91.25-1.53 1.56-1.53H16.9V4.48c-.3-.04-1.33-.13-2.53-.13-2.5 0-4.22 1.53-4.22 4.34v2.43H7.3v3.14h2.85V22h3.49Z" />
              </svg>
            </SocialLink>
            <SocialLink label="LinkedIn">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M6.94 8.5H3.56V20h3.38V8.5Zm.22-3.56A1.96 1.96 0 0 0 5.2 3a1.97 1.97 0 1 0 0 3.94 1.96 1.96 0 0 0 1.96-2ZM20.44 20v-6.2c0-3.32-1.77-4.86-4.13-4.86-1.9 0-2.76 1.05-3.24 1.79V8.5H9.69c.04 1.48 0 11.5 0 11.5h3.38v-6.42c0-.34.02-.68.12-.92.27-.68.88-1.39 1.9-1.39 1.34 0 1.88 1.03 1.88 2.55V20h3.47Z" />
              </svg>
            </SocialLink>
          </div>
        </div>
      </div>
    </footer>
  );
}

// <Footer /> — uses default columns
// <Footer columns={customColumns} /> — override link columns
