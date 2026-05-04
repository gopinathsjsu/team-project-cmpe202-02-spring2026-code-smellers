import type { Request, Response } from "express";
import type { User } from "@supabase/supabase-js";
import * as userTicketService from "../services/userTicket.service";
import * as ticketNotificationService from "../services/ticketNotification.service";

type RequestWithUser = Request & { user?: User };

function bearerToken(req: Request): string {
  return (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
}

function parsePositiveIntegerParam(raw: unknown): number | null {
  const value = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  if (!/^\d+$/.test(value)) {
    return null;
  }
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) {
    return null;
  }
  return n;
}

/**
 * RSVP / create a ticket for an approved event (free events).
 * Returns the ticket row (pending by default).
 */
export const rsvpForEvent = async (req: Request, res: Response) => {
  try {
    const authUser = (req as RequestWithUser).user;
    if (!authUser?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = bearerToken(req);
    if (!token) {
      return res.status(401).json({ error: "Missing access token" });
    }

    const eventId = parsePositiveIntegerParam(req.params.eventId);
    if (eventId === null) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const result = await userTicketService.rsvpForEvent(token, authUser.id, eventId);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    void ticketNotificationService.sendRsvpPromptForNewTicket(result.ticket.id).catch((err) => {
      console.error("RSVP email failed:", err);
    });

    return res.status(201).json({ ticket: result.ticket });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};

function buildHtmlPage(title: string, message: string, isSuccess: boolean): string {
  const bgColor = isSuccess ? "#d1fae5" : "#fee2e2";
  const textColor = isSuccess ? "#065f46" : "#991b1b";
  const borderColor = isSuccess ? "#6ee7b7" : "#fca5a5";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 60px 40px;
          max-width: 500px;
          text-align: center;
          border-left: 6px solid ${borderColor};
        }
        .icon {
          font-size: 60px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 28px;
          margin-bottom: 12px;
          color: #111827;
        }
        p {
          font-size: 16px;
          line-height: 1.6;
          color: #4b5563;
          margin-bottom: 30px;
          background: ${bgColor};
          padding: 15px;
          border-radius: 8px;
          color: ${textColor};
        }
        .button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 12px 32px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          transition: background 0.2s;
        }
        .button:hover {
          background: #5a67d8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">${isSuccess ? "✓" : "✕"}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <a href="http://localhost:5173/" class="button">Back to Home</a>
      </div>
    </body>
    </html>
  `;
}

export const respondToRsvpEmailLink = async (req: Request, res: Response) => {
  try {
    const eventId = parsePositiveIntegerParam(req.params.eventId);
    if (eventId === null) {
      return res.status(400).send(
        buildHtmlPage(
          "Invalid Event",
          "The event ID in this link is invalid. Please check the link and try again.",
          false,
        ),
      );
    }

    const token = typeof req.query.token === "string" ? req.query.token : "";
    const decisionRaw = typeof req.query.decision === "string" ? req.query.decision : "";
    const decision = decisionRaw === "yes" || decisionRaw === "no" ? decisionRaw : null;

    if (!token) {
      return res.status(400).send(
        buildHtmlPage("Missing Token", "This RSVP link is incomplete or invalid.", false),
      );
    }
    if (!decision) {
      return res.status(400).send(
        buildHtmlPage(
          "Invalid Response",
          "Please use a valid yes/no link from your email.",
          false,
        ),
      );
    }

    const result = await ticketNotificationService.respondToTicketEmailLink({
      eventId,
      token,
      decision,
    });

    if (!result.ok) {
      const messages: Record<number, string> = {
        400: "This link is invalid or expired.",
        404: "The ticket or event was not found.",
        409: "Your RSVP has already been processed.",
        500: "An unexpected error occurred. Please try again later.",
      };
      return res.status(result.status).send(
        buildHtmlPage(
          "RSVP Error",
          messages[result.status] || result.error,
          false,
        ),
      );
    }

    const statusText =
      result.status === "confirmed" ? "confirmed ✓" : "canceled";
    const title =
      result.status === "confirmed"
        ? "RSVP Confirmed!"
        : "RSVP Canceled";
    const message =
      result.status === "confirmed"
        ? "Thank you for confirming your attendance. See you at the event!"
        : "Your RSVP has been canceled.";

    return res.status(200).send(buildHtmlPage(title, message, true));
  } catch (error) {
    return res.status(500).send(
      buildHtmlPage(
        "Server Error",
        "An unexpected error occurred. Please try again later.",
        false,
      ),
    );
  }
};

