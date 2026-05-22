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
  let htmlTitle = "";

  try {
    const response = await fetch(rawUrl, {
      redirect: "follow",
      headers: {
        "accept-language": "ko,en;q=0.8",
        "user-agent": "Mozilla/5.0 RecogitalyBot/1.0"
      }
    });

    finalUrl = response.url || rawUrl;
    const html = await response.text();
    htmlTitle = extractTitle(html);
  } catch {
    htmlTitle = "";
  }

  const fallbackName = nameFromUrl(finalUrl) || nameFromUrl(rawUrl);
  const name = cleanGoogleMapsTitle(htmlTitle) || fallbackName;

  return NextResponse.json({
    name,
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
