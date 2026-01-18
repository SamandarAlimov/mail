import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface DbEmail {
  id: string;
  user_id: string;
  thread_id: string | null;
  from_name: string;
  from_email: string;
  from_avatar: string | null;
  to_recipients: Array<{ name: string; email: string }>;
  cc_recipients: Array<{ name: string; email: string }>;
  subject: string;
  snippet: string | null;
  body: string;
  is_read: boolean;
  is_starred: boolean;
  is_verified: boolean;
  priority: "low" | "normal" | "medium" | "high";
  folder: string;
  labels: string[];
  attachments: Array<{ name: string; size: string; type: string; path?: string }>;
  ai_summary: string | null;
  ai_actions: string[];
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export function useEmails(folder: string = "inbox") {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emails, setEmails] = useState<DbEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmails = useCallback(async () => {
    if (!user) {
      setEmails([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .eq("user_id", user.id)
        .eq("folder", folder)
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching emails:", error);
        return;
      }

      setEmails((data as DbEmail[]) || []);
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoading(false);
    }
  }, [user, folder]);

  // Initial fetch
  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`emails-${user.id}-${folder}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "emails",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Realtime email update:", payload);

          if (payload.eventType === "INSERT") {
            const newEmail = payload.new as DbEmail;
            if (newEmail.folder === folder) {
              setEmails((prev) => [newEmail, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedEmail = payload.new as DbEmail;
            setEmails((prev) =>
              prev.map((email) =>
                email.id === updatedEmail.id ? updatedEmail : email
              ).filter((email) => email.folder === folder)
            );
          } else if (payload.eventType === "DELETE") {
            const deletedEmail = payload.old as DbEmail;
            setEmails((prev) =>
              prev.filter((email) => email.id !== deletedEmail.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, folder]);

  const createEmail = useCallback(async (emailData: Omit<DbEmail, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const { data, error } = await supabase
        .from("emails")
        .insert({
          ...emailData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Failed to send email",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Email sent",
      });

      return { data, error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [user, toast]);

  const updateEmail = useCallback(async (emailId: string, updates: Partial<DbEmail>) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const { error } = await supabase
        .from("emails")
        .update(updates)
        .eq("id", emailId)
        .eq("user_id", user.id);

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [user]);

  const deleteEmail = useCallback(async (emailId: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const { error } = await supabase
        .from("emails")
        .delete()
        .eq("id", emailId)
        .eq("user_id", user.id);

      if (error) {
        toast({
          title: "Delete failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Email deleted",
      });

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [user, toast]);

  const summarizeEmail = useCallback(async (emailId: string, body: string, subject: string, fromName: string) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      const { data, error } = await supabase.functions.invoke("summarize-email", {
        body: { emailBody: body, subject, fromName },
      });

      if (error) {
        toast({
          title: "Summarization failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Update email with AI summary
      await supabase
        .from("emails")
        .update({
          ai_summary: data.summary,
          ai_actions: data.actions || [],
        })
        .eq("id", emailId)
        .eq("user_id", user.id);

      toast({
        title: "Email summarized",
        description: "AI analysis complete.",
      });

      return { data, error: null };
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  }, [user, toast]);

  return {
    emails,
    loading,
    fetchEmails,
    createEmail,
    updateEmail,
    deleteEmail,
    summarizeEmail,
  };
}
