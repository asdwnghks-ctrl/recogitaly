import { NextResponse } from "next/server";

const googleMapsHosts = new Set([
  "goo.gl",
  "maps.app.goo.gl",
  "google.com",
  "www.google.com",
  "maps.google.com"
]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

  if (!rawUrl) {
    return NextResponse.json({ message: "지도 링크가 필요해요." }, { status: 400 });
  }

  const parsedUrl = parseUrl(rawUrl);
  if (!parsedUrl || !isGoogleMapsHost(parsedUrl.hostname)) {
    return NextResponse.json({ message: "구글 지도 링크만 불러올 수 있어요." }, { status: 400 });
  }

  let finalUrl = rawUrl;
  let html = "";

  try {
    const response = await fetch(rawUrl, {
      redirect: "follow",
      headers: {
        "accept-language": "ko,en;q=0.8",
        "user-agent": "Mozilla/5.0 RecogitalyBot/1.0"
      }
    });

    finalUrl = response.url || rawUrl;
    html = await response.text();
  } catch {
    html = "";
  }

  const structuredPlace = extractStructuredPlace(html);
  const htmlTitle = extractTitle(html);
  const fallbackName = nameFromUrl(finalUrl) || nameFromUrl(rawUrl);
  const name = cleanGoogleMapsTitle(structuredPlace.name || htmlTitle) || fallbackName;
  const address = structuredPlace.address || extractAddress(html, name);

  return NextResponse.json({
    name,
    address,
    url: finalUrl
  });
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isGoogleMapsHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return googleMapsHosts.has(normalized) || normalized.endsWith(".google.com");
}

function extractTitle(html: string) {
  const title =
    findMetaContent(html, "property", "og:title") ??
    findMetaContent(html, "name", "twitter:title") ??
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ??
    "";
  return decodeHtmlEntities(title);
}

function extractAddress(html: string, placeName: string) {
  const description =
    findMetaContent(html, "property", "og:description") ??
    findMetaContent(html, "name", "description") ??
    "";
  const decoded = decodeHtmlEntities(description);

  if (!decoded || /find local businesses|view maps|get driving directions/i.test(decoded)) {
    return "";
  }

  const withoutName = placeName ? decoded.replace(new RegExp(`^${escapeRegExp(placeName)}\\s*[-·|,]*\\s*`, "i"), "") : decoded;
  const parts = withoutName.split(/\s*[·|]\s*/).map((part) => part.trim()).filter(Boolean);
  const addressLikePart = parts.find(looksLikeAddress);

  return addressLikePart ?? (looksLikeAddress(withoutName) ? withoutName.trim() : "");
}

function extractStructuredPlace(html: string) {
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];

  for (const script of scripts) {
    const jsonText = decodeHtmlEntities(script.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "").trim());
    const parsed = parseJson(jsonText);
    const place = findStructuredPlace(parsed);

    if (place.name || place.address) {
      return place;
    }
  }

  return { name: "", address: "" };
}

function parseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function findStructuredPlace(value: unknown): { name: string; address: string } {
  if (Array.isArray(value)) {
    for (const item of value) {
      const place = findStructuredPlace(item);
      if (place.name || place.address) return place;
    }
    return { name: "", address: "" };
  }

  if (!value || typeof value !== "object") {
    return { name: "", address: "" };
  }

  const object = value as Record<string, unknown>;
  const name = typeof object.name === "string" ? decodeHtmlEntities(object.name) : "";
  const address = formatStructuredAddress(object.address);

  if (name || address) {
    return { name, address };
  }

  const graph = object["@graph"];
  if (graph) {
    return findStructuredPlace(graph);
  }

  return { name: "", address: "" };
}

function formatStructuredAddress(value: unknown) {
  if (typeof value === "string") {
    return decodeHtmlEntities(value);
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const object = value as Record<string, unknown>;
  return ["streetAddress", "addressLocality", "addressRegion", "postalCode", "addressCountry"]
    .map((key) => addressPartToString(object[key]))
    .filter(Boolean)
    .join(", ");
}

function addressPartToString(value: unknown) {
  if (typeof value === "string") {
    return decodeHtmlEntities(value);
  }

  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    if (typeof object.name === "string") return decodeHtmlEntities(object.name);
  }

  return "";
}

function findMetaContent(html: string, attributeName: "name" | "property", attributeValue: string) {
  const tags = html.match(/<meta[^>]+>/gi) ?? [];

  for (const tag of tags) {
    if (getAttribute(tag, attributeName)?.toLowerCase() === attributeValue.toLowerCase()) {
      return getAttribute(tag, "content") || null;
    }
  }

  return null;
}

function getAttribute(tag: string, name: string) {
  return tag.match(new RegExp(`${name}=["']([^"']+)["']`, "i"))?.[1] ?? "";
}

function cleanGoogleMapsTitle(value: string) {
  return value
    .replace(/\s*[-·]\s*Google Maps\s*$/i, "")
    .replace(/^Google Maps\s*$/i, "")
    .trim();
}

function nameFromUrl(value: string) {
  const parsed = parseUrl(value);
  if (!parsed) return "";

  const query = parsed.searchParams.get("query") ?? parsed.searchParams.get("q");
  if (query) return decodeQueryPart(query);

  const placeMatch = parsed.pathname.match(/\/place\/([^/]+)/);
  if (placeMatch?.[1]) return decodeQueryPart(placeMatch[1]);

  return "";
}

function decodeQueryPart(value: string) {
  return decodeURIComponent(value.replace(/\+/g, " ")).trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function looksLikeAddress(value: string) {
  return /[0-9]/.test(value) || /,/.test(value) || /\b(via|viale|piazza|street|st\.|road|rd\.|avenue|ave\.)\b/i.test(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
