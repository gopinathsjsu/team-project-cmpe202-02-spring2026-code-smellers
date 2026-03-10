export interface EventCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  date: string;
  location: string;
  isSaved?: boolean;
  onSaveToggle?: (id: string) => void;
  onClick?: (id: string) => void;
}
