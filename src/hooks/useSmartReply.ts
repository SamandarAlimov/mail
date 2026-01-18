import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface SmartReply {
  type: "quick" | "detailed" | "defer";
  label: string;
  content: string;
}

export function useSmartReply() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState<SmartReply[]>([]);

  const generateReplies = useCallback(async (
    emailBody: string,
    subject: string,
    fromName: string,
    fromEmail: string
  ) => {
    setLoading(true);
    setReplies([]);

    try {
      const { data, error } = await supabase.functions.invoke("smart-reply", {
        body: { emailBody, subject, fromName, fromEmail },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setReplies(data.replies || []);
      return data.replies;
    } catch (error) {
      console.error("Smart reply error:", error);
      toast({
        title: "Smart reply failed",
        description: error instanceof Error ? error.message : "Could not generate replies",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearReplies = useCallback(() => {
    setReplies([]);
  }, []);

  return {
    loading,
    replies,
    generateReplies,
    clearReplies,
  };
}
