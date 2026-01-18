import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Contact {
  name: string;
  email: string;
  avatar?: string;
  frequency: number;
}

export function useContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch all emails to extract contacts
      const { data, error } = await supabase
        .from("emails")
        .select("from_name, from_email, from_avatar, to_recipients, cc_recipients")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching contacts:", error);
        setLoading(false);
        return;
      }

      // Extract unique contacts from emails
      const contactMap = new Map<string, Contact>();

      data?.forEach((email) => {
        // From sender
        if (email.from_email && email.from_email !== "me@alsamos.com") {
          const existing = contactMap.get(email.from_email);
          contactMap.set(email.from_email, {
            name: email.from_name || email.from_email.split("@")[0],
            email: email.from_email,
            avatar: email.from_avatar || undefined,
            frequency: (existing?.frequency || 0) + 1,
          });
        }

        // To recipients
        const toRecipients = email.to_recipients as Array<{ name: string; email: string }> || [];
        toRecipients.forEach((r) => {
          if (r.email && r.email !== "me@alsamos.com") {
            const existing = contactMap.get(r.email);
            contactMap.set(r.email, {
              name: r.name || r.email.split("@")[0],
              email: r.email,
              frequency: (existing?.frequency || 0) + 1,
            });
          }
        });

        // CC recipients
        const ccRecipients = email.cc_recipients as Array<{ name: string; email: string }> || [];
        ccRecipients.forEach((r) => {
          if (r.email && r.email !== "me@alsamos.com") {
            const existing = contactMap.get(r.email);
            contactMap.set(r.email, {
              name: r.name || r.email.split("@")[0],
              email: r.email,
              frequency: (existing?.frequency || 0) + 1,
            });
          }
        });
      });

      // Sort by frequency (most contacted first)
      const sortedContacts = Array.from(contactMap.values()).sort(
        (a, b) => b.frequency - a.frequency
      );

      setContacts(sortedContacts);
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const searchContacts = useCallback(
    (query: string): Contact[] => {
      if (!query.trim()) return contacts.slice(0, 5);

      const lowerQuery = query.toLowerCase();
      return contacts
        .filter(
          (c) =>
            c.name.toLowerCase().includes(lowerQuery) ||
            c.email.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 8);
    },
    [contacts]
  );

  return {
    contacts,
    loading,
    searchContacts,
    refreshContacts: fetchContacts,
  };
}
