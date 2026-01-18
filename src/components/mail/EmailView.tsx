import { useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Reply,
  ReplyAll,
  Forward,
  MoreHorizontal,
  Trash2,
  Archive,
  Tag,
  Shield,
  Paperclip,
  Download,
  Sparkles,
  Clock,
  FileText,
  ChevronDown,
  Wand2,
  Languages,
  ListTodo,
  Zap,
  Loader2,
  MessageSquarePlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DbEmail } from "@/hooks/useEmails";
import { useSmartReply, SmartReply } from "@/hooks/useSmartReply";
import { useAttachments } from "@/hooks/useAttachments";

interface EmailViewProps {
  email: DbEmail | null;
  onSummarize?: (emailId: string, body: string, subject: string, fromName: string) => Promise<{ data?: any; error: Error | null }>;
  onDelete?: (emailId: string) => Promise<{ error: Error | null }>;
  onUpdate?: (emailId: string, updates: Partial<DbEmail>) => Promise<{ error: Error | null }>;
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function EmailView({ email, onSummarize, onDelete, onUpdate }: EmailViewProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [quickReplyText, setQuickReplyText] = useState("");
  const { loading: smartReplyLoading, replies: smartReplies, generateReplies, clearReplies } = useSmartReply();
  const { downloadAttachment } = useAttachments();

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
    { icon: Zap, label: "Detect Urgency", description: "Priority analysis", onClick: () => {} },
  ];

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
      key={email.id}
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
          <Button variant="ghost" size="icon">
            <Tag className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Subject */}
          <h1 className="text-2xl font-bold mb-6">{email.subject}</h1>

          {/* AI Summary */}
          {email.ai_summary && (
            <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">AI Summary</span>
              </div>
              <p className="text-sm text-foreground">{email.ai_summary}</p>
              {email.ai_actions && email.ai_actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-primary/20">
                  <span className="text-xs font-medium text-muted-foreground">Action Items:</span>
                  <ul className="mt-1 space-y-1">
                    {email.ai_actions.map((action, i) => (
                      <li key={i} className="text-sm flex items-center gap-2">
                        <ListTodo className="w-3 h-3 text-primary" />
                        {String(action)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

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

          {/* Sender Info */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold",
                email.from_name === "Alsamos AI"
                  ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}>
                {email.from_avatar || getInitials(email.from_name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{email.from_name}</span>
                  {email.is_verified && (
                    <div className="flex items-center gap-1 text-emerald-500">
                      <Shield className="w-4 h-4" />
                      <span className="text-xs font-medium">Verified</span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {email.from_email}
                </div>
                <button className="flex items-center gap-1 text-xs text-muted-foreground mt-1 hover:text-foreground">
                  to me
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatFullDate(email.timestamp)}
            </div>
          </div>

          {/* Labels */}
          {email.labels && email.labels.length > 0 && (
            <div className="flex gap-2 mb-6">
              {email.labels.map((label) => (
                <span
                  key={label}
                  className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Body */}
          <div 
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attachments ({email.attachments.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(email.attachments as Array<{ name: string; size: string; type: string; path?: string }>).map((attachment, idx) => (
                  <div
                    key={idx}
                    className="glass-card rounded-lg p-4 flex items-center gap-3 hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => handleDownloadAttachment(attachment)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {attachment.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {attachment.size}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <span className="text-sm text-muted-foreground">Quick reply</span>
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
