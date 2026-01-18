import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Reply,
  ReplyAll,
  Forward,
  MoreHorizontal,
  Trash2,
  Archive,
  Shield,
  Paperclip,
  Download,
  Sparkles,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Wand2,
  Languages,
  ListTodo,
  Zap,
  Loader2,
  MessageSquarePlus,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DbEmail } from "@/hooks/useEmails";
import { EmailThread } from "@/hooks/useEmailThreads";
import { useSmartReply, SmartReply } from "@/hooks/useSmartReply";
import { Label } from "@/hooks/useLabels";
import { LabelSelector } from "./LabelSelector";
import { useAttachments } from "@/hooks/useAttachments";

interface ThreadViewProps {
  email: DbEmail | null;
  thread?: EmailThread | null;
  labels?: Label[];
  onSummarize?: (emailId: string, body: string, subject: string, fromName: string) => Promise<{ data?: any; error: Error | null }>;
  onDelete?: (emailId: string) => Promise<{ error: Error | null }>;
  onUpdate?: (emailId: string, updates: Partial<DbEmail>) => Promise<{ error: Error | null }>;
  onManageLabels?: () => void;
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function EmailMessage({ 
  email, 
  isExpanded, 
  onToggle, 
  isLast,
  onDownloadAttachment 
}: { 
  email: DbEmail; 
  isExpanded: boolean; 
  onToggle: () => void;
  isLast: boolean;
  onDownloadAttachment: (attachment: { name: string; path?: string }) => void;
}) {
  return (
    <div className={cn(
      "border border-border rounded-xl overflow-hidden",
      isExpanded ? "bg-card" : "bg-card/50 hover:bg-card/80 cursor-pointer"
    )}>
      {/* Collapsed Header */}
      <div 
        onClick={!isExpanded ? onToggle : undefined}
        className={cn(
          "p-4 flex items-center gap-4",
          !isExpanded && "cursor-pointer"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
          email.from_name === "Alsamos AI"
            ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}>
          {email.from_avatar || getInitials(email.from_name)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{email.from_name}</span>
            {email.is_verified && (
              <Shield className="w-4 h-4 text-emerald-500" />
            )}
            {!email.is_read && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </div>
          {!isExpanded && (
            <div className="text-sm text-muted-foreground truncate">
              {email.snippet || email.body.replace(/<[^>]*>/g, '').slice(0, 100)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">
            {formatShortDate(email.timestamp)}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="p-1 hover:bg-secondary rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4">
              <div className="text-xs text-muted-foreground mb-4">
                <span>to me</span>
              </div>

              {/* AI Summary */}
              {email.ai_summary && (
                <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-xs font-semibold text-primary">AI Summary</span>
                  </div>
                  <p className="text-sm text-foreground">{email.ai_summary}</p>
                </div>
              )}

              {/* Body */}
              <div 
                className="prose prose-invert prose-sm max-w-none mb-4"
                dangerouslySetInnerHTML={{ __html: email.body }}
              />

              {/* Attachments */}
              {email.attachments && (email.attachments as any[]).length > 0 && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {(email.attachments as any[]).length} Attachment(s)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(email.attachments as Array<{ name: string; size: string; type: string; path?: string }>).map((attachment, idx) => (
                      <button
                        key={idx}
                        onClick={() => onDownloadAttachment(attachment)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm">{attachment.name}</span>
                        <span className="text-xs text-muted-foreground">{attachment.size}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Reply className="w-4 h-4" />
                  Reply
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Forward className="w-4 h-4" />
                  Forward
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ThreadView({ email, thread, labels = [], onSummarize, onDelete, onUpdate, onManageLabels }: ThreadViewProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [quickReplyText, setQuickReplyText] = useState("");
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());
  const { loading: smartReplyLoading, replies: smartReplies, generateReplies, clearReplies } = useSmartReply();
  const { downloadAttachment } = useAttachments();

  // Initialize expanded state for the selected/latest email
  useMemo(() => {
    if (email) {
      setExpandedEmails(new Set([email.id]));
    }
  }, [email?.id]);

  const toggleEmailExpand = (emailId: string) => {
    setExpandedEmails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const handleSummarize = async () => {
    if (!email || !onSummarize) return;
    setIsSummarizing(true);
    await onSummarize(email.id, email.body, email.subject, email.from_name);
    setIsSummarizing(false);
  };

  const handleGenerateSmartReplies = async () => {
    if (!email) return;
    await generateReplies(email.body, email.subject, email.from_name, email.from_email);
  };

  const handleUseSmartReply = (reply: SmartReply) => {
    setQuickReplyText(reply.content);
    clearReplies();
  };

  const handleToggleStar = async () => {
    if (!email || !onUpdate) return;
    await onUpdate(email.id, { is_starred: !email.is_starred });
  };

  const handleDelete = async () => {
    if (!email || !onDelete) return;
    await onDelete(email.id);
  };

  const handleToggleLabel = async (labelName: string) => {
    if (!email || !onUpdate) return;
    const currentLabels = email.labels || [];
    const newLabels = currentLabels.includes(labelName)
      ? currentLabels.filter(l => l !== labelName)
      : [...currentLabels, labelName];
    await onUpdate(email.id, { labels: newLabels });
  };

  const handleDownloadAttachment = async (attachment: { name: string; path?: string }) => {
    if (attachment.path) {
      await downloadAttachment(attachment.path, attachment.name);
    }
  };

  const aiActions = [
    { icon: Wand2, label: "Summarize", description: "Get a quick summary", onClick: handleSummarize, loading: isSummarizing },
    { icon: MessageSquarePlus, label: "Smart Reply", description: "AI-generated response", onClick: handleGenerateSmartReplies, loading: smartReplyLoading },
    { icon: ListTodo, label: "Extract Tasks", description: "Find action items", onClick: () => {} },
    { icon: Languages, label: "Translate", description: "Translate to any language", onClick: () => {} },
  ];

  // Get emails to display (thread emails or just the single email)
  const displayEmails = thread && thread.emails.length > 1 ? thread.emails : email ? [email] : [];
  const isThread = displayEmails.length > 1;

  if (!email) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No email selected</h3>
          <p className="text-sm text-muted-foreground">
            Select an email from the list to view its contents
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key={thread?.id || email.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col"
    >
      {/* Header Actions */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hover:text-primary">
            <Reply className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:text-primary">
            <ReplyAll className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:text-primary">
            <Forward className="w-5 h-5" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button variant="ghost" size="icon" className="hover:text-primary">
            <Archive className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="w-5 h-5" />
          </Button>
          <LabelSelector
            labels={labels}
            selectedLabels={email?.labels || []}
            onToggleLabel={handleToggleLabel}
            onManageLabels={onManageLabels}
          />
        </div>
        <div className="flex items-center gap-2">
          {isThread && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary text-sm">
              <Users className="w-4 h-4" />
              <span>{displayEmails.length} messages</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleToggleStar}>
            <Star className={cn(
              "w-5 h-5",
              email.is_starred ? "fill-primary text-primary" : ""
            )} />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Thread Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Subject */}
          <h1 className="text-2xl font-bold mb-6">{thread?.subject || email.subject}</h1>

          {/* Smart Reply Suggestions */}
          {smartReplies.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquarePlus className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Smart Reply Suggestions</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-xs"
                  onClick={clearReplies}
                >
                  Dismiss
                </Button>
              </div>
              <div className="space-y-2">
                {smartReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleUseSmartReply(reply)}
                    className="w-full text-left p-3 rounded-lg bg-background hover:bg-primary/10 border border-border hover:border-primary/50 transition-all"
                  >
                    <div className="text-xs text-muted-foreground mb-1">{reply.label}</div>
                    <p className="text-sm line-clamp-2">{reply.content}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thread Messages */}
          <div className="space-y-3">
            {displayEmails.map((threadEmail, index) => (
              <EmailMessage
                key={threadEmail.id}
                email={threadEmail}
                isExpanded={expandedEmails.has(threadEmail.id)}
                onToggle={() => toggleEmailExpand(threadEmail.id)}
                isLast={index === displayEmails.length - 1}
                onDownloadAttachment={handleDownloadAttachment}
              />
            ))}
          </div>
        </div>
      </div>

      {/* AI Tools Panel */}
      <div className="p-4 border-t border-border bg-card/30">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">AI Actions</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {aiActions.map((action) => (
            <Button
              key={action.label}
              variant="secondary"
              size="sm"
              className="h-9 gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
              onClick={action.onClick}
              disabled={action.loading}
            >
              {action.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <action.icon className="w-4 h-4" />
              )}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Quick Reply */}
      <div className="p-4 border-t border-border">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Reply className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Reply to {isThread ? "thread" : email.from_name}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={quickReplyText}
              onChange={(e) => setQuickReplyText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Send
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
