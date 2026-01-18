import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Paperclip, Shield, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DbEmail } from "@/hooks/useEmails";
import { EmailThread } from "@/hooks/useEmailThreads";
import { Label } from "@/hooks/useLabels";
import { Checkbox } from "@/components/ui/checkbox";
import { highlightText, getMatchSnippet } from "@/lib/highlightText";
import { BulkActionsBar } from "./BulkActionsBar";

interface ThreadListProps {
  threads: EmailThread[];
  selectedEmail: DbEmail | null;
  onSelectEmail: (email: DbEmail) => void;
  onUpdateEmail?: (emailId: string, updates: Partial<DbEmail>) => Promise<{ error: Error | null }>;
  onDeleteEmail?: (emailId: string) => Promise<{ error: Error | null }>;
  searchQuery?: string;
  labels?: Label[];
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

export function ThreadList({ 
  threads, 
  selectedEmail, 
  onSelectEmail, 
  onUpdateEmail,
  onDeleteEmail,
  searchQuery = "",
  labels = []
}: ThreadListProps) {
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  // Clear selection when threads change
  useEffect(() => {
    setSelectedEmails(new Set());
  }, [threads]);

  const allEmailIds = threads.flatMap(t => t.emails.map(e => e.id));
  const isAllSelected = allEmailIds.length > 0 && allEmailIds.every(id => selectedEmails.has(id));
  const isSomeSelected = allEmailIds.some(id => selectedEmails.has(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(allEmailIds));
    }
  };

  const toggleSelectEmail = (emailId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const toggleSelectThread = (thread: EmailThread, e: React.MouseEvent) => {
    e.stopPropagation();
    const threadEmailIds = thread.emails.map(e => e.id);
    const allSelected = threadEmailIds.every(id => selectedEmails.has(id));
    
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        threadEmailIds.forEach(id => newSet.delete(id));
      } else {
        threadEmailIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const handleBulkApplyLabel = async (labelName: string) => {
    if (!onUpdateEmail) return;
    const promises = Array.from(selectedEmails).map(async (emailId) => {
      const email = threads.flatMap(t => t.emails).find(e => e.id === emailId);
      if (email) {
        const currentLabels = email.labels || [];
        if (!currentLabels.includes(labelName)) {
          await onUpdateEmail(emailId, { labels: [...currentLabels, labelName] });
        }
      }
    });
    await Promise.all(promises);
    setSelectedEmails(new Set());
  };

  const handleBulkRemoveLabel = async (labelName: string) => {
    if (!onUpdateEmail) return;
    const promises = Array.from(selectedEmails).map(async (emailId) => {
      const email = threads.flatMap(t => t.emails).find(e => e.id === emailId);
      if (email && email.labels) {
        const newLabels = email.labels.filter(l => l !== labelName);
        await onUpdateEmail(emailId, { labels: newLabels });
      }
    });
    await Promise.all(promises);
    setSelectedEmails(new Set());
  };

  const handleBulkDelete = async () => {
    if (!onDeleteEmail) return;
    const promises = Array.from(selectedEmails).map(emailId => onDeleteEmail(emailId));
    await Promise.all(promises);
    setSelectedEmails(new Set());
  };

  const handleBulkArchive = async () => {
    if (!onUpdateEmail) return;
    const promises = Array.from(selectedEmails).map(emailId => 
      onUpdateEmail(emailId, { folder: "archive" })
    );
    await Promise.all(promises);
    setSelectedEmails(new Set());
  };

  const handleBulkMarkAsRead = async () => {
    if (!onUpdateEmail) return;
    const promises = Array.from(selectedEmails).map(emailId => 
      onUpdateEmail(emailId, { is_read: true })
    );
    await Promise.all(promises);
    setSelectedEmails(new Set());
  };

  const handleBulkMarkAsUnread = async () => {
    if (!onUpdateEmail) return;
    const promises = Array.from(selectedEmails).map(emailId => 
      onUpdateEmail(emailId, { is_read: false })
    );
    await Promise.all(promises);
    setSelectedEmails(new Set());
  };

  const handleBulkStar = async () => {
    if (!onUpdateEmail) return;
    const promises = Array.from(selectedEmails).map(emailId => 
      onUpdateEmail(emailId, { is_starred: true })
    );
    await Promise.all(promises);
    setSelectedEmails(new Set());
  };

  const handleBulkUnstar = async () => {
    if (!onUpdateEmail) return;
    const promises = Array.from(selectedEmails).map(emailId => 
      onUpdateEmail(emailId, { is_starred: false })
    );
    await Promise.all(promises);
    setSelectedEmails(new Set());
  };

  const handleBulkMoveToFolder = async (folder: string) => {
    if (!onUpdateEmail) return;
    const promises = Array.from(selectedEmails).map(emailId => 
      onUpdateEmail(emailId, { folder })
    );
    await Promise.all(promises);
    setSelectedEmails(new Set());
  };

  const toggleThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedThreads((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const handleToggleStar = async (e: React.MouseEvent, email: DbEmail) => {
    e.stopPropagation();
    if (onUpdateEmail) {
      await onUpdateEmail(email.id, { is_starred: !email.is_starred });
    }
  };

  const handleSelectEmail = async (email: DbEmail) => {
    onSelectEmail(email);
    if (!email.is_read && onUpdateEmail) {
      await onUpdateEmail(email.id, { is_read: true });
    }
  };

  const totalCount = threads.reduce((acc, t) => acc + t.emails.length, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedEmails.size}
        labels={labels}
        onApplyLabel={handleBulkApplyLabel}
        onRemoveLabel={handleBulkRemoveLabel}
        onDelete={handleBulkDelete}
        onMoveToFolder={handleBulkMoveToFolder}
        onArchive={handleBulkArchive}
        onMarkAsRead={handleBulkMarkAsRead}
        onMarkAsUnread={handleBulkMarkAsUnread}
        onStar={handleBulkStar}
        onUnstar={handleBulkUnstar}
        onClearSelection={() => setSelectedEmails(new Set())}
      />

      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox 
            className="border-muted-foreground"
            checked={isAllSelected}
            onCheckedChange={toggleSelectAll}
            {...(isSomeSelected && !isAllSelected ? { "data-state": "indeterminate" } : {})}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {threads.length} conversations ({totalCount} messages)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="ai-chip">
            <Sparkles className="w-3 h-3" />
            AI Priority
          </button>
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No emails found</p>
          </div>
        ) : (
          threads.map((thread, index) => {
            const isExpanded = expandedThreads.has(thread.id);
            const isMultiEmail = thread.emails.length > 1;
            const latestEmail = thread.latestEmail;
            const isSelected = thread.emails.some((e) => e.id === selectedEmail?.id);

            return (
              <div key={thread.id}>
                {/* Thread Header Row */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => {
                    if (isMultiEmail && !isExpanded) {
                      setExpandedThreads((prev) => new Set(prev).add(thread.id));
                    }
                    handleSelectEmail(latestEmail);
                  }}
                  className={cn(
                    "email-row px-4 py-3 border-b border-border/50 cursor-pointer",
                    thread.unreadCount > 0 && "unread",
                    isSelected && "bg-secondary/70"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        className="border-muted-foreground"
                        checked={thread.emails.every(e => selectedEmails.has(e.id))}
                        onClick={(e) => toggleSelectThread(thread, e)}
                      />
                      {isMultiEmail && (
                        <button
                          onClick={(e) => toggleThread(thread.id, e)}
                          className="p-0.5 hover:bg-secondary rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Avatar Stack or Single Avatar */}
                    {isMultiEmail ? (
                      <div className="relative w-10 h-10 shrink-0">
                        <div className={cn(
                          "absolute top-0 left-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-background z-10",
                          "bg-secondary text-secondary-foreground"
                        )}>
                          {getInitials(thread.emails[0].from_name)}
                        </div>
                        <div className={cn(
                          "absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-background",
                          "bg-muted text-muted-foreground"
                        )}>
                          +{thread.emails.length - 1}
                        </div>
                      </div>
                    ) : (
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                        latestEmail.from_name === "Alsamos AI" 
                          ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      )}>
                        {latestEmail.from_avatar || getInitials(latestEmail.from_name)}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-sm truncate",
                          thread.unreadCount > 0 && "font-semibold text-foreground"
                        )}>
                          {isMultiEmail ? (
                            <span className="flex items-center gap-1.5">
                              {searchQuery ? highlightText(thread.participants.slice(0, 2).join(", "), searchQuery) : thread.participants.slice(0, 2).join(", ")}
                              {thread.participants.length > 2 && (
                                <span className="text-muted-foreground text-xs">
                                  +{thread.participants.length - 2}
                                </span>
                              )}
                            </span>
                          ) : (
                            searchQuery ? highlightText(latestEmail.from_name, searchQuery) : latestEmail.from_name
                          )}
                        </span>
                        {latestEmail.is_verified && (
                          <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                        {isMultiEmail && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                            {thread.emails.length}
                          </span>
                        )}
                        {thread.unreadCount > 0 && thread.unreadCount !== thread.emails.length && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-medium">
                            {thread.unreadCount} new
                          </span>
                        )}
                        {latestEmail.priority === "high" && (
                          <span className="priority-badge high shrink-0">Urgent</span>
                        )}
                        {latestEmail.ai_summary && (
                          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      
                      <div className={cn(
                        "text-sm truncate mb-1",
                        thread.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {searchQuery ? highlightText(thread.subject, searchQuery) : thread.subject}
                      </div>
                      
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {searchQuery 
                          ? highlightText(getMatchSnippet(latestEmail.body, searchQuery), searchQuery)
                          : (latestEmail.snippet || latestEmail.body.slice(0, 100))
                        }
                      </div>

                      {/* Labels */}
                      {latestEmail.labels && latestEmail.labels.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {latestEmail.labels.slice(0, 2).map((label) => (
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
                        {formatTimestamp(latestEmail.timestamp)}
                      </span>
                      <div className="flex items-center gap-2">
                        {thread.hasAttachments && (
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                        )}
                        <button
                          onClick={(e) => handleToggleStar(e, latestEmail)}
                          className="hover:text-primary transition-colors"
                        >
                          <Star
                            className={cn(
                              "w-4 h-4",
                              thread.isStarred 
                                ? "fill-primary text-primary" 
                                : "text-muted-foreground"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Expanded Thread Emails */}
                <AnimatePresence>
                  {isExpanded && isMultiEmail && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-secondary/30 border-b border-border/50"
                    >
                      {thread.emails.map((email, emailIndex) => (
                        <motion.div
                          key={email.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: emailIndex * 0.05 }}
                          onClick={() => handleSelectEmail(email)}
                          className={cn(
                            "pl-16 pr-4 py-2.5 border-b border-border/30 cursor-pointer hover:bg-secondary/50 transition-colors",
                            !email.is_read && "bg-primary/5",
                            selectedEmail?.id === email.id && "bg-primary/10"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                              email.from_name === "Alsamos AI" 
                                ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {email.from_avatar || getInitials(email.from_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-sm truncate",
                                  !email.is_read && "font-semibold"
                                )}>
                                  {email.from_name}
                                </span>
                                {!email.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {email.snippet || email.body.slice(0, 60)}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatTimestamp(email.timestamp)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
