export const ALLOWED_URL_SCHEMES = ["http", "https", "mailto", "tel"];

const SCHEME_REGEX = /^[a-z][a-z\d+.-]*:/i;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;

/**
 * Returns a sanitized href when it is a relative path, a fragment, or uses an
 * allowed URL scheme. Returns undefined for anything else (e.g. `javascript:`).
 */
export function getSafeHref(href: null | string | undefined) {
  if (typeof href !== "string") return undefined;

  const value = href.replace(CONTROL_CHARS_REGEX, "").trim();
  if (!value) return undefined;

  // Protocol-relative URLs ("//evil.com", "/\evil.com") are treated as external hosts by browsers
  if (/^[/\\]{2}/.test(value) || value.startsWith("\\")) return undefined;

  if (!SCHEME_REGEX.test(value)) return value;

  try {
    const {protocol} = new URL(value);
    return ALLOWED_URL_SCHEMES.includes(protocol.slice(0, -1).toLowerCase())
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

export function isAbsoluteUrl(href: string) {
  return SCHEME_REGEX.test(href);
}
