import { format, formatDistanceToNow, isPast } from "date-fns";
import { Clock, Trash2, Send, Edit2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ScheduledEmail {
  id: string;
  user_id: string;
  to_recipients: Array<{ name: string; email: string }>;
  cc_recipients: Array<{ name: string; email: string }> | null;
  subject: string;
  body: string;
  attachments: Array<{ name: string; size: string; type: string; path?: string }> | null;
  scheduled_at: string;
  status: "pending" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ScheduledEmailsListProps {
  emails: ScheduledEmail[];
  selectedEmailId: string | null;
  onSelectEmail: (email: ScheduledEmail) => void;
  onDeleteEmail: (emailId: string) => void;
  onSendNow: (email: ScheduledEmail) => void;
  loading?: boolean;
}

export function ScheduledEmailsList({
  emails,
  selectedEmailId,
  onSelectEmail,
  onDeleteEmail,
  onSendNow,
  loading,
}: ScheduledEmailsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p className="text-sm">Loading scheduled emails...</p>
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No scheduled emails</p>
          <p className="text-xs mt-1">Schedule emails to send them later</p>
        </div>
      </div>
    );
  }

  // Separate pending and sent/failed emails
  const pendingEmails = emails.filter((e) => e.status === "pending");
  const pastEmails = emails.filter((e) => e.status !== "pending");

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-border/50">
        {pendingEmails.length > 0 && (
          <>
            <div className="px-4 py-2 bg-muted/30 sticky top-0 z-10">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Scheduled ({pendingEmails.length})
              </span>
            </div>
            {pendingEmails.map((email) => (
              <ScheduledEmailItem
                key={email.id}
                email={email}
                isSelected={selectedEmailId === email.id}
                onSelect={() => onSelectEmail(email)}
                onDelete={() => onDeleteEmail(email.id)}
                onSendNow={() => onSendNow(email)}
              />
            ))}
          </>
        )}

        {pastEmails.length > 0 && (
          <>
            <div className="px-4 py-2 bg-muted/30 sticky top-0 z-10">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sent ({pastEmails.length})
              </span>
            </div>
            {pastEmails.map((email) => (
              <ScheduledEmailItem
                key={email.id}
                email={email}
                isSelected={selectedEmailId === email.id}
                onSelect={() => onSelectEmail(email)}
                onDelete={() => onDeleteEmail(email.id)}
                onSendNow={() => onSendNow(email)}
              />
            ))}
          </>
        )}
      </div>
    </ScrollArea>
  );
}

function ScheduledEmailItem({
  email,
  isSelected,
  onSelect,
  onDelete,
  onSendNow,
}: {
  email: ScheduledEmail;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onSendNow: () => void;
}) {
  const scheduledDate = new Date(email.scheduled_at);
  const isOverdue = email.status === "pending" && isPast(scheduledDate);
  const recipients = email.to_recipients.map((r) => r.email).join(", ");
  const previewText = email.body.replace(/<[^>]*>/g, "").substring(0, 80);

  return (
    <div
      className={cn(
        "group px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50",
        isSelected && "bg-muted"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Clock className={cn(
              "w-4 h-4 shrink-0",
              email.status === "sent" ? "text-emerald-500" : 
              email.status === "failed" ? "text-destructive" : 
              isOverdue ? "text-amber-500" : "text-primary"
            )} />
            <span className="font-medium text-sm truncate">
              {email.subject || "(No subject)"}
            </span>
            {email.status === "sent" && (
              <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-500">
                Sent
              </Badge>
            )}
            {email.status === "failed" && (
              <Badge variant="destructive" className="text-xs">
                Failed
              </Badge>
            )}
            {isOverdue && email.status === "pending" && (
              <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/50">
                <AlertCircle className="w-3 h-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground mb-1 truncate">
            To: {recipients || "(No recipients)"}
          </div>

          {previewText && (
            <p className="text-xs text-muted-foreground truncate mb-2">
              {previewText}...
            </p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn(
              email.status === "sent" ? "text-emerald-500" : 
              isOverdue ? "text-amber-500" : ""
            )}>
              {email.status === "sent" 
                ? `Sent ${format(new Date(email.sent_at!), "MMM d 'at' h:mm a")}`
                : `Scheduled for ${format(scheduledDate, "MMM d 'at' h:mm a")}`
              }
            </span>
            {email.status === "pending" && (
              <span className="text-muted-foreground/60">
                ({formatDistanceToNow(scheduledDate, { addSuffix: true })})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {email.status === "pending" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onSendNow();
              }}
              title="Send now"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
