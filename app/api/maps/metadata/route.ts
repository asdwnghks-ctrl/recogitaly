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

  const fallbackName = nameFromUrl(finalUrl) || nameFromUrl(rawUrl);
  const previewPlace = await fetchPreviewPlace(html, finalUrl, fallbackName);
  const structuredPlace = extractStructuredPlace(html);
  const htmlTitle = extractTitle(html);
  const name = cleanGoogleMapsTitle(structuredPlace.name || htmlTitle) || fallbackName;
  const address = previewPlace.address || structuredPlace.address || extractAddress(html, name);

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

async function fetchPreviewPlace(html: string, baseUrl: string, placeName: string) {
  const previewUrl = extractPreviewUrl(html, baseUrl);
  if (!previewUrl) return { name: "", address: "" };

  try {
    const response = await fetch(previewUrl, {
      headers: {
        "accept-language": "ko,en;q=0.8",
        "user-agent": "Mozilla/5.0 RecogitalyBot/1.0",
        referer: baseUrl
      }
    });
    const previewText = await response.text();
    return extractPreviewPlace(previewText, placeName);
  } catch {
    return { name: "", address: "" };
  }
}

function extractPreviewUrl(html: string, baseUrl: string) {
  const match = html.match(/<link href=["']([^"']*\/maps\/preview\/place[^"']+)["'][^>]*rel=["']preload["']/i);
  const rawUrl = match?.[1] ? decodeHtmlEntities(match[1]) : "";

  if (!rawUrl) return "";

  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return "";
  }
}

function extractPreviewPlace(value: string, placeName: string) {
  const jsonText = value.replace(/^\)\]\}'\s*/, "").trim();
  const parsed = parseJson(jsonText);
  if (!parsed) return { name: "", address: "" };

  const address = findPreviewAddress(parsed, placeName);
  return { name: "", address };
}

function findPreviewAddress(value: unknown, placeName: string) {
  const candidates: Array<{ value: string; score: number }> = [];
  collectAddressCandidates(value, candidates, placeName);

  return candidates.sort((a, b) => b.score - a.score)[0]?.value ?? "";
}

function collectAddressCandidates(value: unknown, candidates: Array<{ value: string; score: number }>, placeName: string) {
  if (Array.isArray(value)) {
    const stringParts = value.map((item) => (typeof item === "string" ? cleanPreviewString(item) : "")).filter(Boolean);
    if (stringParts.length >= 2 && stringParts.length <= 5 && looksLikeAddress(stringParts[0])) {
      addAddressCandidate(stringParts.join(", "), candidates, placeName);
    }

    value.forEach((item) => collectAddressCandidates(item, candidates, placeName));
    return;
  }

  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectAddressCandidates(item, candidates, placeName));
    return;
  }

  if (typeof value === "string") {
    addAddressCandidate(value, candidates, placeName);
  }
}

function addAddressCandidate(rawValue: string, candidates: Array<{ value: string; score: number }>, placeName: string) {
  const value = normalizeAddressCandidate(rawValue, placeName);
  if (!value) return;

  candidates.push({ value, score: scoreAddress(value) });
}

function normalizeAddressCandidate(value: string, placeName: string) {
  let candidate = cleanPreviewString(value);
  if (!candidate || candidate.length > 220 || /https?:|\/maps\//i.test(candidate)) return "";

  if (placeName) {
    candidate = candidate.replace(new RegExp(`^${escapeRegExp(placeName)}\\s*[-·|,]*\\s*`, "i"), "").trim();
  }

  if (!looksLikeAddress(candidate)) return "";
  return candidate.replace(/\s+/g, " ");
}

function scoreAddress(value: string) {
  let score = 0;
  if (/^(via|viale|piazza|piazzale|street|st\.|road|rd\.|avenue|ave\.)\b/i.test(value)) score += 4;
  if (value.includes(",")) score += 3;
  if (/\b\d{4,6}\b/.test(value)) score += 2;
  if (/\b(italy|italia|이탈리아)\b/i.test(value)) score += 2;
  if (value.length >= 20 && value.length <= 140) score += 1;
  return score;
}

function cleanPreviewString(value: string) {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
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
    .replace(/^Google 지도\s*$/i, "")
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
  return /[0-9]/.test(value) || /,/.test(value) || /\b(via|viale|piazza|piazzale|street|st\.|road|rd\.|avenue|ave\.)\b/i.test(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
