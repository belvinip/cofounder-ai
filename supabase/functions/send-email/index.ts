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
    case "booking_confirmed":
      return { subject: `✅ Booking confirmed — ${data.when || ""}`,
        html: wrap("Your meeting is booked!",
          `Your <strong>${data.duration || 30} minute</strong> meeting with <strong>${data.hostName || "your host"}</strong> is confirmed for <strong>${data.when || "the selected time"}</strong> (Australian Eastern Time).`,
          cta("Visit ABAA Community", "")) };
    case "booking_cancelled":
      return { subject: `Booking cancelled — ${data.when || ""}`,
        html: wrap("Your meeting was cancelled",
          `Unfortunately your meeting scheduled for <strong>${data.when || "the selected time"}</strong> has been cancelled by the host. You're welcome to book another time.`,
          cta("Book again", "")) };
    default:
      return { subject: "ABAA Community", html: wrap("Notification", data.message || "You have an update.") };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { type, to, data } = await req.json();
    if (!to || !type) return new Response(JSON.stringify({ error: "to and type required" }), { status: 400, headers: cors });

    const { subject, html } = buildEmail(type, data || {});

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Resend error");
    return new Response(JSON.stringify({ ok: true, id: json.id }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: cors });
  }
});
