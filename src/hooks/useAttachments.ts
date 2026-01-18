import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface UploadedAttachment {
  name: string;
  size: string;
  type: string;
  path: string;
  url?: string;
}

export function useAttachments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadAttachment = useCallback(async (file: File): Promise<UploadedAttachment | null> => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to upload attachments.",
        variant: "destructive",
      });
      return null;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("email-attachments")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      };

      return {
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
        path: filePath,
      };
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload attachment",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [user, toast]);

  const getAttachmentUrl = useCallback(async (path: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.storage
        .from("email-attachments")
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error("Failed to get attachment URL:", error);
      return null;
    }
  }, [user]);

  const deleteAttachment = useCallback(async (path: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase.storage
        .from("email-attachments")
        .remove([path]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      return false;
    }
  }, [user]);

  const downloadAttachment = useCallback(async (path: string, fileName: string) => {
    const url = await getAttachmentUrl(path);
    if (!url) {
      toast({
        title: "Download failed",
        description: "Could not generate download link.",
        variant: "destructive",
      });
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [getAttachmentUrl, toast]);

  return {
    uploading,
    uploadAttachment,
    getAttachmentUrl,
    deleteAttachment,
    downloadAttachment,
  };
}
