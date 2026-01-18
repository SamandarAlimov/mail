import { useMemo } from "react";
import { DbEmail } from "@/hooks/useEmails";

export interface EmailThread {
  id: string;
  subject: string;
  emails: DbEmail[];
  latestEmail: DbEmail;
  unreadCount: number;
  isStarred: boolean;
  participants: string[];
  hasAttachments: boolean;
}

export function useEmailThreads(emails: DbEmail[]) {
  const threads = useMemo(() => {
    const threadMap = new Map<string, DbEmail[]>();
    
    emails.forEach((email) => {
      // Use thread_id if available, otherwise use a normalized subject as the thread key
      const threadKey = email.thread_id || normalizeSubject(email.subject);
      
      if (!threadMap.has(threadKey)) {
        threadMap.set(threadKey, []);
      }
      threadMap.get(threadKey)!.push(email);
    });

    // Convert map to array of threads
    const threadArray: EmailThread[] = [];
    
    threadMap.forEach((threadEmails, threadId) => {
      // Sort emails by timestamp (oldest first for thread view)
      const sortedEmails = [...threadEmails].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const latestEmail = sortedEmails[sortedEmails.length - 1];
      const unreadCount = sortedEmails.filter((e) => !e.is_read).length;
      const isStarred = sortedEmails.some((e) => e.is_starred);
      
      // Get unique participants
      const participantSet = new Set<string>();
      sortedEmails.forEach((e) => {
        participantSet.add(e.from_name);
      });
      
      const hasAttachments = sortedEmails.some(
        (e) => e.attachments && (e.attachments as any[]).length > 0
      );

      threadArray.push({
        id: threadId,
        subject: normalizeSubject(latestEmail.subject, false),
        emails: sortedEmails,
        latestEmail,
        unreadCount,
        isStarred,
        participants: Array.from(participantSet),
        hasAttachments,
      });
    });

    // Sort threads by latest email timestamp (newest first)
    return threadArray.sort(
      (a, b) =>
        new Date(b.latestEmail.timestamp).getTime() -
        new Date(a.latestEmail.timestamp).getTime()
    );
  }, [emails]);

  return { threads };
}

// Normalize subject by removing Re:, Fwd:, etc.
function normalizeSubject(subject: string, lowercase = true): string {
  let normalized = subject
    .replace(/^(re:|fwd:|fw:)\s*/gi, "")
    .replace(/^(re:|fwd:|fw:)\s*/gi, "") // Handle multiple prefixes
    .trim();
  
  return lowercase ? normalized.toLowerCase() : normalized;
}
