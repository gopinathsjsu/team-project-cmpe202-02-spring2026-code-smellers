import crypto from "crypto";
import sgMail from "@sendgrid/mail";
import type { Database } from "../types/database.types";
import { getSupabaseClient } from "../lib/supabase";

type NotificationType = "rsvp_prompt" | "reminder_24h";
type RsvpDecision = "yes" | "no";

type LocationEmbed = {
  venue_name: string | null;
  address: string | null;
};

type EventEmbed = {
  id: number;
  title: string;
  start_date_time: string | null;
  image_url: string | null;
  locations: LocationEmbed | LocationEmbed[] | null;
};

type UserEmbed = {
  email: string | null;
  display_name: string | null;
};

type TicketEmailContext = {
  id: number;
  customer_id: string | null;
  event_id: number;
  rsvp_status: Database["public"]["Enums"]["ticket_rsvp_status"] | null;
  is_email_sent: boolean | null;
  events: EventEmbed | EventEmbed[] | null;
  users: UserEmbed | UserEmbed[] | null;
};

type TicketResponseToken = {
  ticketId: number;
  eventId: number;
  customerId: string;
  exp: number;
};

type MailerEmailResult = {
  ok: true;
  messageId: string | null;
} | {
  ok: false;
  error: string;
};

let mailerClient: any | null = null;

function unwrapEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function getAppBaseUrl(): string {
  const fallback = `http://localhost:${process.env.PORT ?? "3000"}`;
  return (env("APP_BASE_URL") ?? fallback).replace(/\/$/, "");
}

function getMailerApiKey(): string | null {
  return env("SENDGRID_API_KEY") ?? env("RESEND_API_KEY") ?? env("MAILER_API_KEY");
}

function getMailerFromEmail(): string | null {
  return env("SENDGRID_FROM_EMAIL") ?? env("RESEND_FROM_EMAIL") ?? env("MAILER_FROM_EMAIL");
}

function getMailerFromName(): string {
  return env("SENDGRID_FROM_NAME") ?? env("RESEND_FROM_NAME") ?? env("MAILER_FROM_NAME") ?? "Eventdull";
}

function getMailerClient(): typeof sgMail | null {
  const apiKey = getMailerApiKey();
  if (!apiKey) return null;
  if (!mailerClient) {
    sgMail.setApiKey(apiKey);
    // reuse mailerClient variable to indicate initialized
    mailerClient = sgMail as unknown as any;
  }
  return sgMail;
}

function getMailerFrom(): string | null {
  const email = getMailerFromEmail();
  if (!email) return null;
  const name = getMailerFromName().trim();
  if (!name || email.includes("<")) return email;
  return `${name} <${email}>`;
}

function getNotificationSecret(): string | null {
  return env("NOTIFICATION_LINK_SECRET") ?? env("SUPABASE_JWT_SECRET");
}

function buildEventDateLabel(iso: string | null): string {
  if (!iso) {
    return "Date TBA";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Date TBA";
  }
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildLocationLabel(loc: LocationEmbed | null): string {
  if (!loc) {
    return "Location TBA";
  }
  const venue = loc.venue_name?.trim();
  const address = loc.address?.trim();
  const parts = [venue, address].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(", ") : "Location TBA";
}

function getDisplayName(user: UserEmbed | null): string {
  return user?.display_name?.trim() || "there";
}

function getEmailAddress(user: UserEmbed | null): string | null {
  return user?.email?.trim() ?? null;
}

function createSignedToken(payload: TicketResponseToken): string | null {
  const secret = getNotificationSecret();
  if (!secret) {
    return null;
  }

  const rawPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(rawPayload).digest("base64url");
  return `${rawPayload}.${signature}`;
}

function verifySignedToken(token: string): TicketResponseToken | null {
  const secret = getNotificationSecret();
  if (!secret) {
    return null;
  }

  const [rawPayload, signature] = token.split(".");
  if (!rawPayload || !signature) {
    return null;
  }

  const expected = crypto.createHmac("sha256", secret).update(rawPayload).digest("base64url");
  const provided = Buffer.from(signature);
  const actual = Buffer.from(expected);
  if (provided.length !== actual.length || !crypto.timingSafeEqual(provided, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(rawPayload, "base64url").toString("utf8")) as TicketResponseToken;
    if (
      typeof payload?.ticketId !== "number" ||
      typeof payload?.eventId !== "number" ||
      typeof payload?.customerId !== "string" ||
      typeof payload?.exp !== "number"
    ) {
      return null;
    }
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function buildRsvpResponseUrl(eventId: number, token: string, decision: RsvpDecision): string {
  return `${getAppBaseUrl()}/api/events/${eventId}/tickets/respond?token=${encodeURIComponent(token)}&decision=${encodeURIComponent(decision)}`;
}

function buildPromptEmailHtml(params: {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  yesUrl: string;
  noUrl: string;
}): string {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 12px">Please confirm your RSVP</h2>
      <p style="margin:0 0 12px">Hi ${params.userName},</p>
      <p style="margin:0 0 12px">You registered for <strong>${params.eventTitle}</strong>.</p>
      <p style="margin:0 0 12px">When: ${params.eventDate}<br />Where: ${params.eventLocation}</p>
      <p style="margin:0 0 20px">Please confirm whether you&apos;re attending.</p>
      <p style="margin:0 0 12px">
        <a href="${params.yesUrl}" style="display:inline-block;background:#0f766e;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;margin-right:8px">Yes, I&apos;m going</a>
        <a href="${params.noUrl}" style="display:inline-block;background:#f3f4f6;color:#111827;padding:10px 16px;border-radius:6px;text-decoration:none">No, I can&apos;t make it</a>
      </p>
    </div>
  `;
}

function buildReminderEmailHtml(params: {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
}): string {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 12px">Event reminder</h2>
      <p style="margin:0 0 12px">Hi ${params.userName},</p>
      <p style="margin:0 0 12px">Your RSVP for <strong>${params.eventTitle}</strong> is confirmed.</p>
      <p style="margin:0 0 12px">This event starts soon:</p>
      <p style="margin:0">When: ${params.eventDate}<br />Where: ${params.eventLocation}</p>
    </div>
  `;
}

async function sendMailerEmail(params: {
  toEmail: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}): Promise<MailerEmailResult> {
  const sg = getMailerClient();
  const from = getMailerFrom();
  if (!sg || !from) {
    return { ok: false, error: "SendGrid is not configured" };
  }

  try {
    const msg = {
      to: params.toEmail,
      from,
      subject: params.subject,
      html: params.htmlContent,
      text: params.textContent,
    };

    const response = await sg.send(msg as any);

    // SendGrid returns an array of responses; attempt to read a message-id header
    let messageId: string | null = null;
    try {
      const first = Array.isArray(response) ? response[0] : response;
      const headers = first?.headers as Record<string, string> | undefined;
      messageId = (headers && (headers["x-message-id"] || headers["x-mailgun-id"])) ?? null;
    } catch {
      messageId = null;
    }

    return { ok: true, messageId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "SendGrid request failed",
    };
  }
}

async function hasNotificationBeenSent(
  ticketId: number,
  type: NotificationType,
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("ticket_notifications")
    .select("id")
    .eq("ticket_id", ticketId)
    .eq("notification_type", type)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

async function logNotificationSent(
  ticketId: number,
  type: NotificationType,
  emailMessageId: string | null,
): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase.from("ticket_notifications").insert({
    ticket_id: ticketId,
    notification_type: type,
    email_message_id: emailMessageId,
  } satisfies Database["public"]["Tables"]["ticket_notifications"]["Insert"]);
}

async function loadTicketEmailContext(ticketId: number): Promise<{ ok: true; ticket: TicketEmailContext } | { ok: false; error: string }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      `
      id,
      customer_id,
      event_id,
      rsvp_status,
      is_email_sent,
      events (
        id,
        title,
        start_date_time,
        image_url,
        locations ( venue_name, address )
      ),
      users (
        email,
        display_name
      )
    `,
    )
    .eq("id", ticketId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data) {
    return { ok: false, error: "Ticket not found" };
  }

  return { ok: true, ticket: data as TicketEmailContext };
}

async function loadReminderCandidates(): Promise<TicketEmailContext[]> {
  const supabase = getSupabaseClient();
  const now = new Date();
  const future = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("tickets")
    .select(
      `
      id,
      customer_id,
      event_id,
      rsvp_status,
      is_email_sent,
      events (
        id,
        title,
        start_date_time,
        image_url,
        locations ( venue_name, address )
      ),
      users (
        email,
        display_name
      )
    `,
    )
    .eq("rsvp_status", "confirmed");

  if (error || !data) {
    return [];
  }

  return (data as TicketEmailContext[]).filter((ticket) => {
    const event = unwrapEmbed(ticket.events);
    if (!event?.start_date_time) {
      return false;
    }
    const start = new Date(event.start_date_time);
    return !Number.isNaN(start.getTime()) && start >= now && start < future;
  });
}

function getReminderText(params: { userName: string; eventTitle: string; eventDate: string; eventLocation: string }): string {
  return `Hi ${params.userName}, your RSVP for ${params.eventTitle} is confirmed. This event starts soon: ${params.eventDate}. Location: ${params.eventLocation}.`;
}

async function sendPromptEmailForTicket(ticketId: number): Promise<void> {
  const contextRes = await loadTicketEmailContext(ticketId);
  if (!contextRes.ok) {
    throw new Error(contextRes.error);
  }

  const ticket = contextRes.ticket;
  if (ticket.rsvp_status !== "pending") {
    return;
  }

  const user = unwrapEmbed(ticket.users);
  const event = unwrapEmbed(ticket.events);
  const toEmail = getEmailAddress(user);
  if (!toEmail || !event) {
    return;
  }

  if (await hasNotificationBeenSent(ticket.id, "rsvp_prompt")) {
    return;
  }

  const token = createSignedToken({
    ticketId: ticket.id,
    eventId: ticket.event_id,
    customerId: ticket.customer_id ?? "",
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  if (!token) {
    return;
  }

  const yesUrl = buildRsvpResponseUrl(ticket.event_id, token, "yes");
  const noUrl = buildRsvpResponseUrl(ticket.event_id, token, "no");
  const subject = `Confirm your RSVP for ${event.title}`;
  const htmlContent = buildPromptEmailHtml({
    userName: getDisplayName(user),
    eventTitle: event.title,
    eventDate: buildEventDateLabel(event.start_date_time),
    eventLocation: buildLocationLabel(unwrapEmbed(event.locations)),
    yesUrl,
    noUrl,
  });
  const textContent = `Please confirm your RSVP for ${event.title}. Yes: ${yesUrl} No: ${noUrl}`;

  const sendResult = await sendMailerEmail({
    toEmail,
    subject,
    htmlContent,
    textContent,
  });

  if (!sendResult.ok) {
    throw new Error(sendResult.error);
  }

  const supabase = getSupabaseClient();
  await supabase
    .from("tickets")
    .update({ is_email_sent: true })
    .eq("id", ticket.id);
  await logNotificationSent(ticket.id, "rsvp_prompt", sendResult.messageId);
}

async function sendReminderEmailForTicket(ticketId: number): Promise<void> {
  const contextRes = await loadTicketEmailContext(ticketId);
  if (!contextRes.ok) {
    throw new Error(contextRes.error);
  }

  const ticket = contextRes.ticket;
  if (ticket.rsvp_status !== "confirmed") {
    return;
  }

  if (await hasNotificationBeenSent(ticket.id, "reminder_24h")) {
    return;
  }

  const user = unwrapEmbed(ticket.users);
  const event = unwrapEmbed(ticket.events);
  const toEmail = getEmailAddress(user);
  if (!toEmail || !event) {
    return;
  }

  const sendResult = await sendMailerEmail({
    toEmail,
    subject: `Reminder: ${event.title} starts soon`,
    htmlContent: buildReminderEmailHtml({
      userName: getDisplayName(user),
      eventTitle: event.title,
      eventDate: buildEventDateLabel(event.start_date_time),
      eventLocation: buildLocationLabel(unwrapEmbed(event.locations)),
    }),
    textContent: getReminderText({
      userName: getDisplayName(user),
      eventTitle: event.title,
      eventDate: buildEventDateLabel(event.start_date_time),
      eventLocation: buildLocationLabel(unwrapEmbed(event.locations)),
    }),
  });

  if (!sendResult.ok) {
    throw new Error(sendResult.error);
  }

  await logNotificationSent(ticket.id, "reminder_24h", sendResult.messageId);
}

export async function sendPendingRsvpPromptEmails(): Promise<void> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("id")
    .eq("rsvp_status", "pending");

  if (error || !data) {
    return;
  }

  for (const row of data) {
    try {
      await sendPromptEmailForTicket(row.id);
    } catch {
      // best-effort retry job
    }
  }
}

export async function sendUpcomingReminderEmails(): Promise<void> {
  const candidates = await loadReminderCandidates();
  for (const ticket of candidates) {
    try {
      await sendReminderEmailForTicket(ticket.id);
    } catch {
      // best-effort retry job
    }
  }
}

export async function sendRsvpPromptForNewTicket(ticketId: number): Promise<void> {
  await sendPromptEmailForTicket(ticketId);
}

export async function respondToTicketEmailLink(params: {
  eventId: number;
  token: string;
  decision: RsvpDecision;
}): Promise<
  | { ok: true; status: Database["public"]["Enums"]["ticket_rsvp_status"] }
  | { ok: false; error: string; status: 400 | 404 | 409 | 500 }
> {
  const payload = verifySignedToken(params.token);
  if (!payload) {
    return { ok: false, error: "Invalid or expired RSVP link", status: 400 };
  }

  if (payload.eventId !== params.eventId) {
    return { ok: false, error: "Mismatched RSVP link", status: 400 };
  }

  const supabase = getSupabaseClient();
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("id, event_id, customer_id, rsvp_status")
    .eq("id", payload.ticketId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }
  if (!ticket || ticket.event_id !== params.eventId || ticket.customer_id !== payload.customerId) {
    return { ok: false, error: "Ticket not found", status: 404 };
  }

  if (ticket.rsvp_status === "canceled" && params.decision === "no") {
    return { ok: true, status: "canceled" };
  }
  if (ticket.rsvp_status === "confirmed" && params.decision === "yes") {
    return { ok: true, status: "confirmed" };
  }
  if (ticket.rsvp_status !== "pending") {
    return { ok: false, error: "RSVP is no longer pending", status: 409 };
  }

  if (params.decision === "yes") {
    const { error: updateErr } = await supabase
      .from("tickets")
      .update({ rsvp_status: "confirmed" })
      .eq("id", ticket.id);
    if (updateErr) {
      return { ok: false, error: updateErr.message, status: 500 };
    }
    return { ok: true, status: "confirmed" };
  }

  const { data: eventRow, error: eventErr } = await supabase
    .from("events")
    .select("id, rsvp_count")
    .eq("id", params.eventId)
    .maybeSingle();

  if (eventErr) {
    return { ok: false, error: eventErr.message, status: 500 };
  }
  if (!eventRow) {
    return { ok: false, error: "Event not found", status: 404 };
  }

  const nextCount = Math.max(0, (eventRow.rsvp_count ?? 0) - 1);
  const { error: ticketUpdateErr } = await supabase
    .from("tickets")
    .update({ rsvp_status: "canceled" })
    .eq("id", ticket.id);
  if (ticketUpdateErr) {
    return { ok: false, error: ticketUpdateErr.message, status: 500 };
  }

  const { error: eventUpdateErr } = await supabase
    .from("events")
    .update({ rsvp_count: nextCount })
    .eq("id", params.eventId);
  if (eventUpdateErr) {
    return { ok: false, error: eventUpdateErr.message, status: 500 };
  }

  return { ok: true, status: "canceled" };
}