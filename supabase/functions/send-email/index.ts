// Supabase Edge Function: send-email
// Sends transactional emails via Resend. The Resend API key lives ONLY in
// Edge Function secrets (server-side) — never in the browser.
//
// Called from the app (and/or DB webhooks) with { type, to, data }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = Deno.env.get("EMAIL_FROM") || "ABAA Community <noreply@abaa.au>";
const APP_URL = Deno.env.get("APP_URL") || "https://app.abaa.au";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Simple branded HTML wrapper
function wrap(title: string, body: string, cta?: { label: string; url: string }) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#0a0e1a;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
      <div style="background:#14182a;border:1px solid #232a42;border-radius:20px;padding:32px;">
        <div style="font-size:22px;font-weight:700;background:linear-gradient(135deg,#7cb9e8,#a78bfa);-webkit-background-clip:text;background-clip:text;color:#a78bfa;margin-bottom:8px;">ABAA Community</div>
        <h1 style="color:#fff;font-size:20px;margin:16px 0;">${title}</h1>
        <div style="color:#b8c0d8;font-size:15px;line-height:1.6;">${body}</div>
        ${cta ? `<a href="${cta.url}" style="display:inline-block;margin-top:24px;background:linear-gradient(135deg,#7c6fe0,#a78bfa);color:#fff;text-decoration:none;padding:12px 28px;border-radius:14px;font-weight:600;">${cta.label}</a>` : ""}
        <div style="color:#566;font-size:12px;margin-top:32px;border-top:1px solid #232a42;padding-top:16px;">You're receiving this because you're part of the ABAA founder community.</div>
      </div>
    </div></body></html>`;
}

function buildEmail(type: string, data: any): { subject: string; html: string } {
  const cta = (label: string, path = "") => ({ label, url: `${APP_URL}${path}` });
  switch (type) {
    case "welcome":
      return { subject: "Welcome to ABAA Community 🎉",
        html: wrap(`Welcome, ${data.name || "there"}!`,
          `You've joined the ABAA founder community — where founders find co-founders, partners, and collaborators.<br><br>Complete your profile to start matching and unlock your free digital business card.`,
          cta("Complete your profile", "")) };
    case "signin":
      return { subject: "New sign-in to your ABAA account",
        html: wrap(`Welcome back, ${data.name || "there"}`,
          `You just signed in to ABAA Community. If this was you, no action is needed.<br><br>If you don't recognise this sign-in, please review your account security.`,
          cta("Open ABAA", "")) };
    case "event_created":
      return { subject: "Your event was submitted ✓",
        html: wrap("Event submitted for review",
          `Your event <strong>${data.title || ""}</strong> has been submitted. An admin will review and approve it shortly, then it'll be visible to the whole community.`,
          cta("View events", "")) };
    case "project_created":
      return { subject: "Your project is live ✓",
        html: wrap("Project created",
          `Your project <strong>${data.projectName || ""}</strong> is now live in the community. Founders can discover it and request to join.`,
          cta("View your projects", "")) };
    case "event_register":
      return { subject: "Registration received ⏳",
        html: wrap("You're on the list — pending approval",
          `You registered for <strong>${data.title || "an event"}</strong>. The host will review your registration and confirm your spot.`,
          cta("View event", "")) };
    case "event_approved":
      return { subject: "You're confirmed! 🎟️",
        html: wrap("Registration approved",
          `Great news — the host approved your spot for <strong>${data.title || "the event"}</strong>. See you there!`,
          cta("View event", "")) };
    case "new_registration":
      return { subject: "New registration for your event",
        html: wrap("Someone wants to attend",
          `<strong>${data.attendeeName || "A member"}</strong> registered for your event <strong>${data.title || ""}</strong>. Review and approve them in the app.`,
          cta("Review registrations", "")) };
    case "partner_request":
      return { subject: "New partnership request 🤝",
        html: wrap("Someone wants to connect",
          `<strong>${data.fromName || "A founder"}</strong> sent you a partnership request. Open the app to view their profile and respond.`,
          cta("View request", "")) };
    case "partner_accepted":
      return { subject: "Partnership accepted! 🎉",
        html: wrap("You're connected",
          `<strong>${data.byName || "Your match"}</strong> accepted your partnership request. You can now message each other and see contact details.`,
          cta("Open chat", "")) };
    case "join_request":
      return { subject: "Someone wants to join your project",
        html: wrap("New project join request",
          `<strong>${data.fromName || "A member"}</strong> requested to join <strong>${data.projectName || "your project"}</strong> as ${data.role || "a collaborator"}.`,
          cta("Review request", "")) };
    case "join_accepted":
      return { subject: "You're in! Project join accepted 🎉",
        html: wrap("Join request accepted",
          `You've been accepted to <strong>${data.projectName || "the project"}</strong>. Contact details are now shared.`,
          cta("View project", "")) };
    case "new_message":
      return { subject: `New message from ${data.fromName || "a connection"}`,
        html: wrap("You have a new message",
          `<strong>${data.fromName || "Someone"}</strong> sent you a message in ABAA Community.`,
          cta("Read & reply", "")) };
    case "new_booking":
      return { subject: `📅 New booking: ${data.guestName || "Someone"} — ${data.when || ""}`,
        html: wrap("You have a new meeting booked",
          `<strong>${data.guestName || "Someone"}</strong> booked a meeting with you for <strong>${data.when || "an upcoming time"}</strong>.${data.note ? `<br><br>Their note: "${data.note}"` : ""}<br><br>You can manage your bookings in your profile.`,
          cta("View bookings", "")) };
    case "event_waitlisted":
      return { subject: `📋 You're on the waitlist — ${data.title || "event"}`,
        html: wrap("You're on the waitlist",
          `<strong>${data.title || "This event"}</strong> is currently full, so we've added you to the waitlist.<br><br>If a spot opens up, you'll be notified straight away and moved into the registration queue.`,
          cta("View event", "")) };
    case "waitlist_promoted":
      return { subject: `🎉 A spot opened up — ${data.title || "event"}`,
        html: wrap("Good news — a spot opened up!",
          `A place has become available for <strong>${data.title || "the event"}</strong> and you've been moved off the waitlist.<br><br>Your registration is now with the host for approval.`,
          cta("View event", "")) };
    case "event_announcement":
      return { subject: `📣 Update: ${data.title || "your event"}`,
        html: wrap(`Update from the host`,
          `<div style="color:#8b93ab;font-size:13px;margin-bottom:12px;">Regarding <strong style="color:#fff;">${data.title || "your event"}</strong></div>
           <div style="background:#0d1120;border:1px solid #232a42;border-radius:14px;padding:16px;color:#b8c0d8;white-space:pre-wrap;">${data.body || ""}</div>`,
          cta("View event", "")) };
    case "booking_request":
      return { subject: `📅 Meeting request from ${data.guestName || "someone"} — ${data.when || ""}`,
        html: wrap("You have a new meeting request",
          `<strong>${data.guestName || "Someone"}</strong> would like to meet with you.
           <div style="background:#0d1120;border:1px solid #232a42;border-radius:14px;padding:16px;margin:18px 0;">
             <div style="color:#fff;font-size:15px;margin-bottom:8px;">📅 <strong>${data.when || "An upcoming time"}</strong></div>
             <div style="color:#8b93ab;font-size:14px;margin-bottom:4px;">⏱️ ${data.duration || 30} minutes</div>
             <div style="color:#8b93ab;font-size:14px;margin-bottom:4px;">👤 ${data.guestName || ""}</div>
             ${data.guestEmail ? `<div style="color:#8b93ab;font-size:14px;">✉️ ${data.guestEmail}</div>` : ""}
             ${data.note ? `<div style="color:#b8c0d8;font-size:14px;margin-top:10px;padding-top:10px;border-top:1px solid #232a42;"><em>"${data.note}"</em></div>` : ""}
           </div>
           Tap below to <strong>accept or decline</strong>. Once you accept, you'll both receive the video call link and a calendar invite.`,
          { label: "✓ Review & Accept Booking", url: `${APP_URL}?bookings=1` }) };
    case "booking_submitted":
      return { subject: `Meeting request sent to ${data.hostName || "your host"} — ${data.when || ""}`,
        html: wrap("Your meeting request was sent ✓",
          `Your request has been sent to <strong>${data.hostName || "your host"}</strong>.
           <div style="background:#0d1120;border:1px solid #232a42;border-radius:14px;padding:16px;margin:18px 0;">
             <div style="color:#fff;font-size:15px;margin-bottom:8px;">📅 <strong>${data.when || "the selected time"}</strong></div>
             <div style="color:#8b93ab;font-size:14px;">⏱️ ${data.duration || 30} minutes</div>
           </div>
           You'll get a confirmation email with the <strong>video call link</strong> and a calendar invite as soon as they accept.`,
          cta("Visit ABAA Community", "")) };
    case "booking_accepted":
      return { subject: `✅ Meeting confirmed — ${data.when || ""}`,
        html: wrap("Your meeting is confirmed! 🎉",
          `Your meeting with <strong>${data.hostName || "your contact"}</strong> is locked in.
           <div style="background:#0d1120;border:1px solid #232a42;border-radius:14px;padding:16px;margin:18px 0;">
             <div style="color:#fff;font-size:15px;margin-bottom:8px;">📅 <strong>${data.when || "the selected time"}</strong></div>
             <div style="color:#8b93ab;font-size:14px;margin-bottom:4px;">⏱️ ${data.duration || 30} minutes (Australian Eastern Time)</div>
             ${data.link ? `<div style="color:#8b93ab;font-size:14px;">🎥 Video call ready</div>` : ""}
           </div>
           ${data.link ? `Click the button below at your meeting time to join the video room — no app or account needed.<br><br><span style="color:#8b93ab;font-size:13px;">Or paste this link: <a href="${data.link}" style="color:#a78bfa;">${data.link}</a></span>` : ""}
           <br><br>📎 A calendar invite is attached — tap it to add this meeting to your calendar.`,
          data.link ? { label:"🎥 Join the Video Call", url:data.link } : cta("Visit ABAA Community","")) };
    case "booking_declined":
      return { subject: `Meeting request declined — ${data.when || ""}`,
        html: wrap("Meeting request declined",
          `Unfortunately <strong>${data.hostName || "the host"}</strong> couldn't make <strong>${data.when || "the selected time"}</strong> work. You're welcome to pick another time.`,
          cta("Book another time", "")) };
    case "booking_cancelled":
      return { subject: `Meeting cancelled — ${data.when || ""}`,
        html: wrap("Your meeting was cancelled",
          `Your meeting scheduled for <strong>${data.when || "the selected time"}</strong> has been cancelled by ${data.hostName || "the host"}. You're welcome to book another time.`,
          cta("Book again", "")) };
    default:
      return { subject: "ABAA Community", html: wrap("Notification", data.message || "You have an update.") };
  }
}

// Build a minimal .ics calendar invite (works with Google/Apple/Outlook)
function buildICS(data: any): string | null {
  if (!data.startISO || !data.endISO) return null;
  const dt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  const uid = `${Date.now()}@abaa.au`;
  return [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//ABAA//Booking//EN","METHOD:REQUEST","BEGIN:VEVENT",
    `UID:${uid}`,`DTSTAMP:${dt(new Date().toISOString())}`,`DTSTART:${dt(data.startISO)}`,`DTEND:${dt(data.endISO)}`,
    `SUMMARY:Meeting with ${data.hostName || "ABAA member"}`,
    `DESCRIPTION:Video call: ${data.link || ""}`,
    data.link ? `LOCATION:${data.link}` : "LOCATION:Online",
    "STATUS:CONFIRMED","END:VEVENT","END:VCALENDAR",
  ].join("\r\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { type, to, data } = await req.json();
    if (!to || !type) return new Response(JSON.stringify({ error: "to and type required" }), { status: 400, headers: cors });

    const { subject, html } = buildEmail(type, data || {});

    const body: any = { from: FROM, to: [to], subject, html };
    // Attach a calendar invite for confirmed meetings
    if (type === "booking_accepted") {
      const ics = buildICS(data || {});
      if (ics) {
        body.attachments = [{ filename: "meeting.ics", content: btoa(ics) }];
      }
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Resend error");
    return new Response(JSON.stringify({ ok: true, id: json.id }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: cors });
  }
});
