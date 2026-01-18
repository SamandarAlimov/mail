import { useEffect, useCallback, useState } from "react";
import { DbEmail } from "@/hooks/useEmails";
import { EmailThread } from "@/hooks/useEmailThreads";

interface KeyboardShortcutsOptions {
  threads: EmailThread[];
  selectedEmail: DbEmail | null;
  onSelectEmail: (email: DbEmail) => void;
  onToggleStar?: (emailId: string, isStarred: boolean) => Promise<{ error: Error | null }>;
  onArchive?: (emailId: string) => Promise<{ error: Error | null }>;
  onCompose?: () => void;
  onReply?: () => void;
  enabled?: boolean;
}

const SHORTCUTS = [
  { key: "j", description: "Next conversation" },
  { key: "k", description: "Previous conversation" },
  { key: "s", description: "Star/unstar" },
  { key: "e", description: "Archive" },
  { key: "r", description: "Reply" },
  { key: "c", description: "Compose new" },
  { key: "?", description: "Show shortcuts" },
];

export function useKeyboardShortcuts({
  threads,
  selectedEmail,
  onSelectEmail,
  onToggleStar,
  onArchive,
  onCompose,
  onReply,
  enabled = true,
}: KeyboardShortcutsOptions) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const findCurrentIndex = useCallback(() => {
    if (!selectedEmail) return -1;
    return threads.findIndex((t) => 
      t.emails.some((e) => e.id === selectedEmail.id)
    );
  }, [threads, selectedEmail]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const currentIndex = findCurrentIndex();

      switch (e.key.toLowerCase()) {
        case "j": // Next email
          e.preventDefault();
          if (threads.length > 0) {
            const nextIndex = currentIndex < threads.length - 1 ? currentIndex + 1 : 0;
            onSelectEmail(threads[nextIndex].latestEmail);
          }
          break;

        case "k": // Previous email
          e.preventDefault();
          if (threads.length > 0) {
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : threads.length - 1;
            onSelectEmail(threads[prevIndex].latestEmail);
          }
          break;

        case "s": // Star/unstar
          e.preventDefault();
          if (selectedEmail && onToggleStar) {
            onToggleStar(selectedEmail.id, !selectedEmail.is_starred);
          }
          break;

        case "e": // Archive
          e.preventDefault();
          if (selectedEmail && onArchive) {
            onArchive(selectedEmail.id);
          }
          break;

        case "r": // Reply
          if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (onReply) {
              onReply();
            }
          }
          break;

        case "c": // Compose new
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (onCompose) {
              onCompose();
            }
          }
          break;

        case "?": // Show help (shift + /)
          if (e.shiftKey) {
            e.preventDefault();
            setIsHelpOpen((prev) => !prev);
          }
          break;
      }
    },
    [enabled, threads, selectedEmail, findCurrentIndex, onSelectEmail, onToggleStar, onArchive, onCompose, onReply]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  return {
    shortcuts: SHORTCUTS,
    isHelpOpen,
    setIsHelpOpen,
  };
}
