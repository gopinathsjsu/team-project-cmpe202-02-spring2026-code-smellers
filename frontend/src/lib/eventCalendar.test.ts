import {
  resolveCalendarRange,
  buildGoogleCalendarUrl,
  buildIcsDocument,
  safeIcsFilename,
} from "./eventCalendar";

describe("resolveCalendarRange", () => {
  it("returns null for invalid start", () => {
    expect(resolveCalendarRange({ startIso: "not-a-date", endIso: null, title: "t", description: null, locationLine: "l", eventId: 1 })).toBeNull();
  });

  it("defaults end to one hour after start when endIso is null", () => {
    const r = resolveCalendarRange({
      startIso: "2026-01-15T18:00:00.000Z",
      endIso: null,
      title: "Meetup",
      description: null,
      locationLine: "Hall",
      eventId: 1,
    });
    expect(r).not.toBeNull();
    if (r) {
      expect(r.end.getTime() - r.start.getTime()).toBe(60 * 60 * 1000);
    }
  });
});

describe("buildGoogleCalendarUrl", () => {
  it("returns a calendar.google.com URL when range is valid", () => {
    const url = buildGoogleCalendarUrl({
      title: "Party",
      description: "Details",
      locationLine: "Here",
      startIso: "2026-06-01T12:00:00.000Z",
      endIso: "2026-06-01T14:00:00.000Z",
      eventId: 2,
    });
    expect(url).toContain("https://calendar.google.com/calendar/render");
    expect(url).toContain("text=Party");
  });
});

describe("buildIcsDocument", () => {
  it("includes escaped commas in summary", () => {
    const ics = buildIcsDocument({
      title: "A, B",
      description: null,
      locationLine: "Venue",
      startIso: "2026-03-01T10:00:00.000Z",
      endIso: "2026-03-01T11:00:00.000Z",
      eventId: 3,
    });
    expect(ics).toContain("SUMMARY:A\\, B");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
  });
});

describe("safeIcsFilename", () => {
  it("slugifies title and appends event id", () => {
    expect(safeIcsFilename("My Cool Event!", 42)).toBe("my-cool-event-42.ics");
  });
});
