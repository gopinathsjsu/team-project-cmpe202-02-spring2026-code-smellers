export interface EventCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  date: string;
  location: string;
  /** Optional pill (e.g. RSVP status) shown next to the “Free” row when set. */
  statusLabel?: string;
  isSaved?: boolean;
  onSaveToggle?: (id: string) => void;
  onClick?: (id: string) => void;
}
