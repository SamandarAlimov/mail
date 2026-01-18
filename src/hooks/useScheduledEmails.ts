import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ScheduledEmail {
  id: string;
  user_id: string;
  to_recipients: Array<{ name: string; email: string }>;
  cc_recipients: Array<{ name: string; email: string }> | null;
  subject: string;
  body: string;
  attachments: Array<{ name: string; size: string; type: string; path?: string }> | null;
  scheduled_at: string;
  status: "pending" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ScheduleEmailData {
  to_recipients: Array<{ name: string; email: string }>;
  cc_recipients?: Array<{ name: string; email: string }>;
  subject: string;
  body: string;
  attachments?: Array<{ name: string; size: string; type: string; path?: string }>;
  scheduled_at: Date;
}

export function useScheduledEmails() {
  const { user } = useAuth();
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch scheduled emails
  const fetchScheduledEmails = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await (supabase
      .from("scheduled_emails" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true }) as any);

    if (!error && data) {
      setScheduledEmails(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchScheduledEmails();
  }, [fetchScheduledEmails]);

  // Schedule a new email
  const scheduleEmail = useCallback(
    async (data: ScheduleEmailData) => {
      if (!user) return { error: new Error("Not authenticated") };

      const { data: newEmail, error } = await (supabase
        .from("scheduled_emails" as any)
        .insert({
          user_id: user.id,
          to_recipients: data.to_recipients,
          cc_recipients: data.cc_recipients || [],
          subject: data.subject,
          body: data.body,
          attachments: data.attachments || [],
          scheduled_at: data.scheduled_at.toISOString(),
          status: "pending",
        })
        .select()
        .single() as any);

      if (!error && newEmail) {
        setScheduledEmails((prev) => [...prev, newEmail].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        ));
      }

      return { error, data: newEmail };
    },
    [user]
  );

  // Delete a scheduled email
  const deleteScheduledEmail = useCallback(
    async (emailId: string) => {
      if (!user) return { error: new Error("Not authenticated") };

      const { error } = await (supabase
        .from("scheduled_emails" as any)
        .delete()
        .eq("id", emailId)
        .eq("user_id", user.id) as any);

      if (!error) {
        setScheduledEmails((prev) => prev.filter((e) => e.id !== emailId));
      }

      return { error };
    },
    [user]
  );

  // Send a scheduled email immediately (mark as sent)
  const sendNow = useCallback(
    async (email: ScheduledEmail) => {
      if (!user) return { error: new Error("Not authenticated") };

      // Update status to sent
      const { error } = await (supabase
        .from("scheduled_emails" as any)
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", email.id)
        .eq("user_id", user.id) as any);

      if (!error) {
        setScheduledEmails((prev) =>
          prev.map((e) =>
            e.id === email.id
              ? { ...e, status: "sent" as const, sent_at: new Date().toISOString() }
              : e
          )
        );
      }

      return { error };
    },
    [user]
  );

  // Get count of pending scheduled emails
  const pendingCount = scheduledEmails.filter((e) => e.status === "pending").length;

  return {
    scheduledEmails,
    loading,
    pendingCount,
    scheduleEmail,
    deleteScheduledEmail,
    sendNow,
    refetch: fetchScheduledEmails,
  };
}
