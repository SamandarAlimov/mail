import { motion } from "framer-motion";
import { Star, Paperclip, Clock, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DbEmail } from "@/hooks/useEmails";
import { Checkbox } from "@/components/ui/checkbox";
import { highlightText, getMatchSnippet } from "@/lib/highlightText";

interface EmailListProps {
  emails: DbEmail[];
  selectedEmail: DbEmail | null;
  onSelectEmail: (email: DbEmail) => void;
  onUpdateEmail?: (emailId: string, updates: Partial<DbEmail>) => Promise<{ error: Error | null }>;
  searchQuery?: string;
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function EmailList({ emails, selectedEmail, onSelectEmail, onUpdateEmail, searchQuery = "" }: EmailListProps) {
  const handleToggleStar = async (e: React.MouseEvent, email: DbEmail) => {
    e.stopPropagation();
    if (onUpdateEmail) {
      await onUpdateEmail(email.id, { is_starred: !email.is_starred });
    }
  };

  const handleSelectEmail = async (email: DbEmail) => {
    onSelectEmail(email);
    // Mark as read when selected
    if (!email.is_read && onUpdateEmail) {
      await onUpdateEmail(email.id, { is_read: true });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox className="border-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {emails.length} messages
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="ai-chip">
            <Sparkles className="w-3 h-3" />
            AI Priority
          </button>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No emails found</p>
          </div>
        ) : (
          emails.map((email, index) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => handleSelectEmail(email)}
              className={cn(
                "email-row px-4 py-3 border-b border-border/50 cursor-pointer",
                !email.is_read && "unread",
                selectedEmail?.id === email.id && "bg-secondary/70"
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox 
                  className="mt-1 border-muted-foreground"
                  onClick={(e) => e.stopPropagation()}
                />
                
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                  email.from_name === "Alsamos AI" 
                    ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}>
                  {email.from_avatar || getInitials(email.from_name)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-sm truncate",
                      !email.is_read && "font-semibold text-foreground"
                    )}>
                      {searchQuery ? highlightText(email.from_name, searchQuery) : email.from_name}
                    </span>
                    {email.is_verified && (
                      <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                    {email.priority === "high" && (
                      <span className="priority-badge high shrink-0">Urgent</span>
                    )}
                    {email.priority === "medium" && (
                      <span className="priority-badge medium shrink-0">Important</span>
                    )}
                    {email.ai_summary && (
                      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </div>
                  
                  <div className={cn(
                    "text-sm truncate mb-1",
                    !email.is_read ? "text-foreground font-medium" : "text-muted-foreground"
                  )}>
                    {searchQuery ? highlightText(email.subject, searchQuery) : email.subject}
                  </div>
                  
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {searchQuery 
                      ? highlightText(getMatchSnippet(email.body, searchQuery), searchQuery)
                      : (email.snippet || email.body.slice(0, 100))
                    }
                  </div>

                  {/* Labels */}
                  {email.labels && email.labels.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {email.labels.slice(0, 2).map((label) => (
                        <span
                          key={label}
                          className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(email.timestamp)}
                  </span>
                  <div className="flex items-center gap-2">
                    {email.attachments && email.attachments.length > 0 && (
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                    )}
                    <button
                      onClick={(e) => handleToggleStar(e, email)}
                      className="hover:text-primary transition-colors"
                    >
                      <Star
                        className={cn(
                          "w-4 h-4",
                          email.is_starred 
                            ? "fill-primary text-primary" 
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
