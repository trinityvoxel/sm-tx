import { linkProps } from "./links.js";
import sanitizeHtml from "sanitize-html";
export function cleanHtml(value) {
  return sanitizeHtml(String(value || ""), {
    allowedTags: ["p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "a"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["https", "http"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: safeUrl(attribs.href)
          ? { href: attribs.href, ...linkProps(attribs.href) }
          : {},
      }),
    },
  });
}
export function text(value) {
  // Sanitizing twice prevents entity-encoded markup from becoming executable in a later sink.
  const plain = sanitizeHtml(
    String(value || "").replace(/<(?:br\s*\/?|\/p|\/li)>/gi, " "),
    { allowedTags: [], allowedAttributes: {} },
  );
  return plain
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => {
      const c =
        n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : Number(n);
      return c > 0 && c <= 0x10ffff ? String.fromCodePoint(c) : "";
    })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
export function safeUrl(value) {
  try {
    const u = new URL(value);
    return ["http:", "https:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}
export function xml(value) {
  return String(value || "").replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
}
export function jsonForHtml(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
