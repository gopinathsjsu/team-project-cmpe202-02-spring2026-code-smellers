import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { EventCardProps } from "./EventCard.types";

/** When `imageUrl` is missing, show one of these (picked by event id so it stays stable). */
const EVENT_CARD_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=70",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=70",
] as const;

function fallbackImageUrlForEventId(eventId: string): string {
  let h = 0;
  for (let i = 0; i < eventId.length; i += 1) {
    h = (h * 31 + eventId.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % EVENT_CARD_FALLBACK_IMAGES.length;
  return EVENT_CARD_FALLBACK_IMAGES[idx];
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="14" height="14" rx="1.5" />
      <path d="M3 8h14M7 2v4M13 2v4" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 17c0 0 5-4.5 5-8.5C15 5.5 12.8 3 10 3S5 5.5 5 8.5 10 17 10 17z" />
      <circle cx="10" cy="8.2" r="1.8" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 17.5c-.3 0-.6-.1-.9-.3C6.2 15.2 2 11.2 2 6.5 2 4 4 2 6.5 2c1.9 0 3.4 1.1 4 2.7.6-1.6 2.1-2.7 4-2.7C17 2 19 4 19 6.5c0 4.7-4.2 8.7-7.1 10.7-.3.2-.6.3-.9.3z" />
    </svg>
  );
}

export function EventCard({
  id,
  title,
  imageUrl,
  date,
  location,
  isSaved = false,
  onSaveToggle,
}: EventCardProps) {
  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSaveToggle?.(id);
  };

  const resolvedInitial =
    imageUrl?.trim() || fallbackImageUrlForEventId(id);
  const [cardImageSrc, setCardImageSrc] = useState(resolvedInitial);
  const imageSwapDoneRef = useRef(false);

  useEffect(() => {
    imageSwapDoneRef.current = false;
    setCardImageSrc(imageUrl?.trim() || fallbackImageUrlForEventId(id));
  }, [id, imageUrl]);

  const handleImageError = useCallback(() => {
    if (imageSwapDoneRef.current) {
      return;
    }
    imageSwapDoneRef.current = true;
    setCardImageSrc(fallbackImageUrlForEventId(id));
  }, [id]);

  return (
    <Link
      to={`/events/${id}`}
      className="group block cursor-pointer rounded-lg bg-surface-raised transition-[box-shadow,transform] duration-fast hover:-translate-y-0.5 hover:shadow-elevated"
      style={{ boxShadow: "var(--ds-shadow-card)" }}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-brand-100">
        <img
          src={cardImageSrc}
          alt=""
          className="h-full w-full object-cover"
          onError={handleImageError}
        />
        {onSaveToggle != null && (
          <button
            type="button"
            onClick={handleSaveClick}
            className={
              isSaved
                ? "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-sm bg-accent-400 text-accent-950 transition-colors duration-fast hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                : "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-sm border border-neutral-300 bg-surface-raised text-neutral-600 transition-colors duration-fast hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            }
            aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
          >
            <HeartIcon filled={isSaved} />
          </button>
        )}
      </div>

      <div className="rounded-b-lg p-4">
        <h3 className="font-display text-lg font-semibold text-neutral-900 line-clamp-2">
          {title}
        </h3>
        <div className="mt-2 flex flex-col gap-1 text-sm text-neutral-500">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 shrink-0" />
            {date}
          </span>
          <span className="flex items-center gap-1.5">
            <PinIcon className="h-4 w-4 shrink-0" />
            {location}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold text-accent-600">Free</p>
      </div>
    </Link>
  );
}

// <EventCard
//   id="1"
//   title="Jazz Night at the Civic Center"
//   imageUrl="/images/jazz.jpg"
//   date="Sat, Mar 15 · 7:00 PM"
//   location="San Jose, CA"
//   isSaved={false}
//   onSaveToggle={(id) => console.log('toggle', id)}
// />
