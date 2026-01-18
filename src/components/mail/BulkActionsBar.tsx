import { useState } from "react";
import { Tag, Trash2, Archive, X, Check, Mail, MailOpen, Star, StarOff, FolderInput, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/hooks/useLabels";

interface BulkActionsBarProps {
  selectedCount: number;
  labels: Label[];
  onApplyLabel: (labelName: string) => void;
  onRemoveLabel: (labelName: string) => void;
  onDelete: () => void;
  onMoveToFolder: (folder: string) => void;
  onArchive: () => void;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onStar: () => void;
  onUnstar: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  labels,
  onApplyLabel,
  onRemoveLabel,
  onDelete,
  onMoveToFolder,
  onArchive,
  onMarkAsRead,
  onMarkAsUnread,
  onStar,
  onUnstar,
  onClearSelection,
}: BulkActionsBarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) return null;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <>
    <div className="px-4 py-3 border-b border-border bg-primary/10 flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 px-2"
        >
          <X className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium">
          {selectedCount} selected
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-8 gap-2">
              <Tag className="w-4 h-4" />
              Labels
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-card border-border z-50">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Apply label
            </div>
            {labels.length === 0 ? (
              <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                No labels available
              </div>
            ) : (
              labels.map((label) => (
                <DropdownMenuItem
                  key={label.id}
                  onClick={() => onApplyLabel(label.name)}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1">{label.name}</span>
                  <Check className="w-4 h-4 opacity-0" />
                </DropdownMenuItem>
              ))
            )}
            {labels.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Remove label
                </div>
                {labels.map((label) => (
                  <DropdownMenuItem
                    key={`remove-${label.id}`}
                    onClick={() => onRemoveLabel(label.name)}
                    className="cursor-pointer flex items-center gap-2 text-muted-foreground"
                  >
                    <div
                      className="w-3 h-3 rounded-full shrink-0 opacity-50"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="flex-1">Remove {label.name}</span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="secondary"
          size="sm"
          onClick={onMarkAsRead}
          className="h-8 gap-2"
        >
          <MailOpen className="w-4 h-4" />
          Read
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onMarkAsUnread}
          className="h-8 gap-2"
        >
          <Mail className="w-4 h-4" />
          Unread
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onStar}
          className="h-8 gap-2"
        >
          <Star className="w-4 h-4" />
          Star
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onUnstar}
          className="h-8 gap-2"
        >
          <StarOff className="w-4 h-4" />
          Unstar
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="h-8 gap-2">
              <FolderInput className="w-4 h-4" />
              Move to
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 bg-card border-border z-50">
            <DropdownMenuItem
              onClick={() => onMoveToFolder("inbox")}
              className="cursor-pointer flex items-center gap-2"
            >
              <Inbox className="w-4 h-4" />
              Inbox
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onMoveToFolder("archive")}
              className="cursor-pointer flex items-center gap-2"
            >
              <Archive className="w-4 h-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onMoveToFolder("trash")}
              className="cursor-pointer flex items-center gap-2 text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Trash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="secondary"
          size="sm"
          onClick={onArchive}
          className="h-8 gap-2"
        >
          <Archive className="w-4 h-4" />
          Archive
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleDeleteClick}
          className="h-8 gap-2 hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>
      </div>
    </div>

    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {selectedCount} email{selectedCount > 1 ? 's' : ''}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will move the selected email{selectedCount > 1 ? 's' : ''} to trash. 
            You can restore them from the trash folder if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
