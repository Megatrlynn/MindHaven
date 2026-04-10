import { useEffect } from "react";

const SITE_URL = "https://mindhaven.titans.studio";
const DEFAULT_IMAGE = `${SITE_URL}/thumbnail.jpg`;

interface SEOOptions {
  title: string;
  description: string;
  path?: string;
  robots?: string;
  image?: string;
}

function upsertMetaTag(attr: "name" | "property", key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertCanonical(url: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

export function usePageSEO({ title, description, path = "/", robots = "index, follow", image = DEFAULT_IMAGE }: SEOOptions) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const canonicalUrl = `${SITE_URL}${normalizedPath}`;

    document.title = title;
    upsertMetaTag("name", "description", description);
    upsertMetaTag("name", "robots", robots);
    upsertMetaTag("name", "twitter:title", title);
    upsertMetaTag("name", "twitter:description", description);
    upsertMetaTag("name", "twitter:image", image);
    upsertMetaTag("property", "og:title", title);
    upsertMetaTag("property", "og:description", description);
    upsertMetaTag("property", "og:url", canonicalUrl);
    upsertMetaTag("property", "og:image", image);
    upsertCanonical(canonicalUrl);
  }, [title, description, path, robots, image]);
}
