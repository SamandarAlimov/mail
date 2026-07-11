import { supabase } from "@/integrations/supabase/client";
import { DbEmail } from "@/hooks/useEmails";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://api.alsamos.com").replace(/\/$/, "");

export async function sendOutboundEmail(
  email: Pick<DbEmail, "to_recipients" | "cc_recipients" | "subject" | "body">
) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error(error?.message || "Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/api/mail/send`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: email.to_recipients,
      cc: email.cc_recipients || [],
      subject: email.subject,
      html: email.body,
      text: email.body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Outbound email failed");
  }
  return payload as {
    status: "accepted";
    provider: "resend";
    id: string;
    sender?: {
      name: string;
      email: string;
    };
  };
}
