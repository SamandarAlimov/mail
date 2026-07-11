import DOMPurify from "dompurify";
import { DbEmail } from "@/hooks/useEmails";

type Recipient = { name?: string | null; email?: string | null };

function clean(value?: string | null): string {
  return (value || "").trim();
}

export function formatMailbox(name?: string | null, email?: string | null): string {
  const safeName = clean(name);
  const safeEmail = clean(email);
  if (!safeEmail) return safeName || "Unknown sender";
  if (!safeName || safeName === safeEmail) return safeEmail;
  return `${safeName} <${safeEmail}>`;
}

export function formatSender(email: Pick<DbEmail, "from_name" | "from_email">): string {
  return formatMailbox(email.from_name, email.from_email);
}

export function formatRecipients(recipients?: Recipient[] | null): string {
  if (!recipients || recipients.length === 0) return "";
  return recipients.map((recipient) => formatMailbox(recipient.name, recipient.email)).join(", ");
}

export function getSenderInitials(email: Pick<DbEmail, "from_name" | "from_email">): string {
  const source = clean(email.from_name) || clean(email.from_email) || "?";
  return source
    .split(/[ @._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function htmlToText(html?: string | null): string {
  return clean(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function linkify(text: string): string {
  return escapeHtml(text).replace(
    /\b((?:https?:\/\/|mailto:)[^\s<>"']+)/gi,
    (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  );
}

export function sanitizeEmailHtml(body?: string | null): string {
  const source = clean(body);
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(source);
  const html = looksLikeHtml ? source : linkify(source).replace(/\n/g, "<br>");

  const sanitized = DOMPurify.sanitize(html, {
    ADD_ATTR: ["target"],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel):|data:image\/(?:png|gif|jpe?g|webp|svg\+xml);base64,|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });

  if (typeof document === "undefined") return sanitized;

  const template = document.createElement("template");
  template.innerHTML = sanitized;
  template.content.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href") || "";
    if (/^(https?:|mailto:|tel:)/i.test(href)) {
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    }
  });
  return template.innerHTML;
}
