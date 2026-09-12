// Vercel Edge Middleware
// Social apps (WhatsApp, WeChat, Facebook, LinkedIn, X) do NOT run JavaScript.
// They only read the raw HTML. Because this app is a single-page React app,
// every URL returns the same index.html — so shared profile/event links had no
// unique preview.
//
// This middleware detects those crawlers and returns a small HTML document with
// the correct Open Graph tags for that specific card or event. Real visitors are
// untouched and get the normal app.

export const config = {
  matcher: '/((?!_next|assets|favicon|og-image|.*\\.[a-zA-Z0-9]+$).*)',
};

const SUPABASE_URL = 'https://xvvjruoeggohktflwnak.supabase.co';
const SUPABASE_ANON = 'sb_publishable_Q-vS4CYYvQSsGp0rN8OhwQ_wyDXAC6p';
const SITE = 'https://app.abaa.au';
const DEFAULT_IMG = `${SITE}/og-image.png`;

const CRAWLER = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|redditbot|MicroMessenger|WeChat|QQ|Line\/|SkypeUriPreview|Applebot|Googlebot|bingbot|embedly|Iframely|vkShare|W3C_Validator/i;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function clip(s, n) {
  const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}

function page({ title, description, image, url }) {
  const t = esc(title), d = esc(description), i = esc(image || DEFAULT_IMG), u = esc(url);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>${t}</title>
<meta name="description" content="${d}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="ABAA Community"/>
<meta property="og:title" content="${t}"/>
<meta property="og:description" content="${d}"/>
<meta property="og:image" content="${i}"/>
<meta property="og:image:secure_url" content="${i}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:url" content="${u}"/>
<meta property="og:locale" content="en_AU"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${t}"/>
<meta name="twitter:description" content="${d}"/>
<meta name="twitter:image" content="${i}"/>
<meta http-equiv="refresh" content="0;url=${u}"/>
</head><body><a href="${u}">${t}</a></body></html>`;
}

async function sb(path) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch (e) {
    return null;
  }
}

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!CRAWLER.test(ua)) return; // real visitor — serve the app untouched

  const url = new URL(request.url);
  const cardId = url.searchParams.get('card');
  const eventId = url.searchParams.get('event');
  if (!cardId && !eventId) return; // homepage already has static tags

  const html = (o) =>
    new Response(page(o), {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' },
    });

  // ── Shared digital business card ──
  if (cardId) {
    const p = await sb(
      `profiles?id=eq.${encodeURIComponent(cardId)}&select=name,role,headline,bio,location,avatar_url,cover_url,business_name&limit=1`
    );
    if (!p) return;
    const who = [p.role, p.business_name].filter(Boolean).join(' · ');
    return html({
      title: `${p.name || 'ABAA member'}${who ? ` — ${who}` : ''}`,
      description: clip(
        p.headline || p.bio || `Connect with ${p.name || 'this founder'} on ABAA Community${p.location ? ` · ${p.location}` : ''}`,
        180
      ),
      image: p.cover_url || p.avatar_url || DEFAULT_IMG,
      url: `${SITE}/?card=${encodeURIComponent(cardId)}`,
    });
  }

  // ── Shared event ──
  const e = await sb(
    `events?id=eq.${encodeURIComponent(eventId)}&select=title,description,event_date,location,cover_url&limit=1`
  );
  if (!e) return;
  let when = '';
  try {
    when = new Date(e.event_date).toLocaleDateString('en-AU', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Australia/Melbourne',
    });
  } catch (err) {}
  const cover = e.cover_url && !String(e.cover_url).startsWith('theme:') ? e.cover_url : DEFAULT_IMG;
  return html({
    title: `${e.title || 'Event'} — ABAA Community`,
    description: clip([when, e.location, e.description].filter(Boolean).join(' · '), 180),
    image: cover,
    url: `${SITE}/?event=${encodeURIComponent(eventId)}`,
  });
}
