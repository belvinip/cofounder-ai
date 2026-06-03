// Supabase Edge Function: admin-actions
// Lets a verified ADMIN perform actions on behalf of another user:
//   - register a user for an event
//   - send a partnership (match) request as a user
//   - send a project join request as a user
//
// Security: the service-role key lives ONLY here on the server, never in the browser.
// Every call is checked: the caller must be a logged-in user whose profile has is_admin = true.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // 1. Identify the caller from their JWT
    const authHeader = req.headers.get("Authorization") || "";
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401, headers: cors });
    }

    // 2. Admin client (service role) — bypasses RLS, used only after admin check
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 3. Verify the caller is an admin
    const { data: callerProfile } = await admin
      .from("profiles").select("is_admin").eq("id", caller.id).single();
    if (!callerProfile?.is_admin) {
      return new Response(JSON.stringify({ error: "Admins only" }), { status: 403, headers: cors });
    }

    // 4. Perform the requested action on behalf of target user
    const body = await req.json();
    const { action, targetUserId } = body;
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "targetUserId required" }), { status: 400, headers: cors });
    }

    if (action === "register_event") {
      const { eventId } = body;
      const { error } = await admin.from("event_attendees")
        .upsert({ event_id: eventId, user_id: targetUserId, status: "pending" }, { onConflict: "event_id,user_id" });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, message: "User registered for event" }), { headers: cors });
    }

    if (action === "partner_request") {
      const { toUserId } = body;
      const { error } = await admin.from("match_requests")
        .insert({ from_user_id: targetUserId, to_user_id: toUserId, status: "pending" });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, message: "Partner request sent" }), { headers: cors });
    }

    if (action === "join_project") {
      const { projectId, ownerId, roleApplied } = body;
      const { error } = await admin.from("project_requests")
        .insert({ from_user_id: targetUserId, project_id: projectId, owner_id: ownerId, role_applied: roleApplied, status: "pending" });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, message: "Join request sent" }), { headers: cors });
    }

    // Accept/decline a partnership request on behalf of the recipient (targetUserId = recipient)
    if (action === "respond_partner") {
      const { requestId, status } = body; // status: 'accepted' | 'declined'
      const { error } = await admin.from("match_requests")
        .update({ status }).eq("id", requestId).eq("to_user_id", targetUserId);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, message: `Partner request ${status}` }), { headers: cors });
    }

    // Accept/decline a project join request on behalf of the project owner (targetUserId = owner)
    if (action === "respond_join") {
      const { requestId, status } = body;
      const { error } = await admin.from("project_requests")
        .update({ status }).eq("id", requestId).eq("owner_id", targetUserId);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, message: `Join request ${status}` }), { headers: cors });
    }

    // Approve/decline an event registration on behalf of the host (targetUserId = host)
    if (action === "respond_registration") {
      const { eventId, attendeeId, status } = body; // status: 'approved' | 'declined'
      if (status === "approved") {
        const { error } = await admin.from("event_attendees")
          .update({ status: "approved" }).eq("event_id", eventId).eq("user_id", attendeeId);
        if (error) throw error;
      } else {
        const { error } = await admin.from("event_attendees")
          .delete().eq("event_id", eventId).eq("user_id", attendeeId);
        if (error) throw error;
      }
      return new Response(JSON.stringify({ ok: true, message: `Registration ${status}` }), { headers: cors });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: cors });
  }
});
