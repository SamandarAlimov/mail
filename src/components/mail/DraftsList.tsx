import { formatDistanceToNow } from "date-fns";
import { FileEdit, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

interface DraftsListProps {
  drafts: Draft[];
  selectedDraftId: string | null;
  onSelectDraft: (draft: Draft) => void;
  onDeleteDraft: (draftId: string) => void;
  loading?: boolean;
}

export function DraftsList({
  drafts,
  selectedDraftId,
  onSelectDraft,
  onDeleteDraft,
  loading,
}: DraftsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p className="text-sm">Loading drafts...</p>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <FileEdit className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No drafts</p>
          <p className="text-xs mt-1">Drafts you save will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y divide-border/50">
        {drafts.map((draft) => {
          const previewText = draft.body
            ? draft.body.replace(/<[^>]*>/g, "").substring(0, 100)
            : "";
          
          return (
            <div
              key={draft.id}
              className={cn(
                "group px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50",
                selectedDraftId === draft.id && "bg-muted"
              )}
              onClick={() => onSelectDraft(draft)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileEdit className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium text-sm truncate">
                      {draft.subject || "(No subject)"}
                    </span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-1 truncate">
                    To: {draft.to_recipients || "(No recipients)"}
                  </div>
                  
                  {previewText && (
                    <p className="text-xs text-muted-foreground truncate">
                      {previewText}...
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                    </span>
                    {draft.attachments?.length > 0 && (
                      <span className="text-primary">
                        · {draft.attachments.length} attachment{draft.attachments.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDraft(draft.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
