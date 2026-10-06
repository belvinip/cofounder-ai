// Supabase Edge Function: ocr
// Reads text from a business card photo using OCR.space's engine.
// The API key lives ONLY in Edge Function secrets — never in the browser.
//
// Called from the app with { image: "<base64 data URL>" }
// Returns { ok:true, text:"..." } or { ok:false, error:"..." }

const OCR_KEY = Deno.env.get("OCRSPACE_API_KEY") || "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (!OCR_KEY) {
      return json({ ok: false, error: "OCR not configured" }, 200);
    }

    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return json({ ok: false, error: "image required" }, 400);
    }

    // OCR.space accepts a base64 data URL directly.
    // Engine 2 is markedly better on stylised/short text like business cards.
    async function run(engine: string) {
      const form = new FormData();
      form.append("base64Image", image);
      form.append("language", "eng");
      form.append("OCREngine", engine);
      form.append("scale", "true");           // upscale small text
      form.append("detectOrientation", "true");
      form.append("isTable", "false");

      const res = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: { apikey: OCR_KEY },
        body: form,
      });
      const data = await res.json();
      if (data?.IsErroredOnProcessing) {
        const msg = Array.isArray(data?.ErrorMessage)
          ? data.ErrorMessage.join(" ")
          : String(data?.ErrorMessage || "OCR failed");
        throw new Error(msg);
      }
      return String(data?.ParsedResults?.[0]?.ParsedText || "");
    }

    // Try the stronger engine first, fall back to engine 1 if it errors
    let text = "";
    try {
      text = await run("2");
    } catch (e) {
      try {
        text = await run("1");
      } catch (e2) {
        return json({ ok: false, error: String((e2 as Error)?.message || e2) }, 200);
      }
    }

    return json({ ok: true, text });
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message || e) }, 200);
  }
});
