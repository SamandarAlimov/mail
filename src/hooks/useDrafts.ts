import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Draft {
  id: string;
  user_id: string;
  to_recipients: string;
  cc_recipients: string;
  subject: string;
  body: string;
  attachments: Array<{ name: string; size: string; type: string; path?: string }>;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DraftData {
  to: string;
  cc: string;
  subject: string;
  body: string;
  attachments?: Array<{ name: string; size: string; type: string; path?: string }>;
}

export function useDrafts() {
  const { user } = useAuth();
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save draft with debounce
  const saveDraft = useCallback(
    async (data: DraftData) => {
      if (!user) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save by 2 seconds
      saveTimeoutRef.current = setTimeout(async () => {
        setSaving(true);

        try {
          if (currentDraftId) {
            // Update existing draft
            const { error } = await (supabase
              .from("drafts" as any)
              .update({
                to_recipients: data.to,
                cc_recipients: data.cc,
                subject: data.subject,
                body: data.body,
                attachments: data.attachments || [],
              }) as any)
              .eq("id", currentDraftId)
              .eq("user_id", user.id);

            if (error) {
              console.error("Error updating draft:", error);
            } else {
              setLastSaved(new Date());
            }
          } else {
            // Create new draft
            const { data: newDraft, error } = await (supabase
              .from("drafts" as any)
              .insert({
                user_id: user.id,
                to_recipients: data.to,
                cc_recipients: data.cc,
                subject: data.subject,
                body: data.body,
                attachments: data.attachments || [],
              }) as any)
              .select()
              .single();

            if (error) {
              console.error("Error creating draft:", error);
            } else if (newDraft) {
              setCurrentDraftId(newDraft.id);
              setLastSaved(new Date());
            }
          }
        } catch (err) {
          console.error("Failed to save draft:", err);
        } finally {
          setSaving(false);
        }
      }, 2000);
    },
    [user, currentDraftId]
  );

  // Delete draft
  const deleteDraft = useCallback(async () => {
    if (!user || !currentDraftId) return;

    try {
      await (supabase
        .from("drafts" as any)
        .delete() as any)
        .eq("id", currentDraftId)
        .eq("user_id", user.id);

      setCurrentDraftId(null);
      setLastSaved(null);
    } catch (err) {
      console.error("Failed to delete draft:", err);
    }
  }, [user, currentDraftId]);

  // Clear draft state (call when email is sent)
  const clearDraft = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    deleteDraft();
  }, [deleteDraft]);

  // Reset for new compose
  const resetDraft = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setCurrentDraftId(null);
    setLastSaved(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    currentDraftId,
    setCurrentDraftId,
    saving,
    lastSaved,
    saveDraft,
    deleteDraft,
    clearDraft,
    resetDraft,
  };
}
