/** Compact UTC timestamp for Google Calendar `dates` and ICS (YYYYMMDDTHHmmssZ). */
function toCompactUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export type CalendarEventInput = {
  title: string;
  description: string | null;
  locationLine: string;
  startIso: string;
  endIso: string | null;
  /** Used for stable UID + filename */
  eventId: number;
};

export function resolveCalendarRange(input: CalendarEventInput): {
  start: Date;
  end: Date;
} | null {
  const start = new Date(input.startIso);
  if (Number.isNaN(start.getTime())) return null;
  let end: Date;
  if (input.endIso) {
    const parsed = new Date(input.endIso);
    if (!Number.isNaN(parsed.getTime()) && parsed > start) {
      end = parsed;
    } else {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }
  } else {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }
  return { start, end };
}

export function buildGoogleCalendarUrl(input: CalendarEventInput): string | null {
  const range = resolveCalendarRange(input);
  if (!range) return null;
  const startS = toCompactUtc(range.start);
  const endS = toCompactUtc(range.end);
  const dates = `${startS}/${endS}`;
  const details = (input.description?.trim() ?? "").slice(0, 8000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates,
    details,
    location: input.locationLine,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsDocument(input: CalendarEventInput): string | null {
  const range = resolveCalendarRange(input);
  if (!range) return null;
  const uid = `event-${input.eventId}@event-details`;
  const dtstamp = toCompactUtc(new Date());
  const dtstart = toCompactUtc(range.start);
  const dtend = toCompactUtc(range.end);
  const summary = escapeIcsText(input.title);
  const description = escapeIcsText((input.description?.trim() ?? "").slice(0, 12000));
  const location = escapeIcsText(input.locationLine.slice(0, 2000));

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventDetails//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : "",
    location ? `LOCATION:${location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function downloadIcsFile(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}

export function safeIcsFilename(title: string, eventId: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${slug || "event"}-${eventId}.ics`;
}
