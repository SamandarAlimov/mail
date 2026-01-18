import { useState } from "react";
import { motion } from "framer-motion";
import {
  Inbox, Star, Send, FileText, Clock, AlertTriangle, Trash2, Tag, Plus,
  Cloud, CheckSquare, Calendar, ChevronDown, Sparkles, PenSquare, LucideIcon, Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/hooks/useLabels";

export interface FolderCounts {
  inbox: number;
  starred: number;
  sent: number;
  drafts: number;
  scheduled: number;
  spam: number;
  trash: number;
}

interface MailSidebarProps {
  activeFolder: string;
  onFolderChange: (folder: string) => void;
  onCompose: () => void;
  onCalendarClick?: () => void;
  onTasksClick?: () => void;
  folderCounts?: FolderCounts;
  labels?: Label[];
  onManageLabels?: () => void;
  onLabelClick?: (label: Label) => void;
}

interface FolderItem {
  id: keyof FolderCounts;
  name: string;
  icon: LucideIcon;
}

const folders: FolderItem[] = [
  { id: "inbox", name: "Inbox", icon: Inbox },
  { id: "starred", name: "Starred", icon: Star },
  { id: "sent", name: "Sent", icon: Send },
  { id: "drafts", name: "Drafts", icon: FileText },
  { id: "scheduled", name: "Scheduled", icon: Clock },
  { id: "spam", name: "Spam", icon: AlertTriangle },
  { id: "trash", name: "Trash", icon: Trash2 },
];

export function MailSidebar({ 
  activeFolder, 
  onFolderChange, 
  onCompose, 
  onCalendarClick, 
  onTasksClick, 
  folderCounts,
  labels = [],
  onManageLabels,
  onLabelClick,
}: MailSidebarProps) {
  const [labelsOpen, setLabelsOpen] = useState(true);

  const getCount = (folderId: keyof FolderCounts) => {
    return folderCounts?.[folderId] ?? 0;
  };

  return (
    <aside className="w-64 h-full flex flex-col border-r border-border bg-sidebar">
      <div className="p-4">
        <Button onClick={onCompose} className="w-full compose-button text-primary-foreground font-semibold h-12 rounded-xl glow-orange">
          <PenSquare className="w-5 h-5 mr-2" />
          Compose
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <div className="space-y-1">
          {folders.map((folder) => {
            const count = getCount(folder.id);
            const FolderIcon = folder.icon;
            return (
              <motion.button
                key={folder.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onFolderChange(folder.id)}
                className={cn("sidebar-item w-full text-left", activeFolder === folder.id && "active")}
              >
                <FolderIcon className="w-5 h-5" />
                <span className="flex-1 text-sm">{folder.name}</span>
                {count > 0 && (
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", activeFolder === folder.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-6">
          <button onClick={() => setLabelsOpen(!labelsOpen)} className="flex items-center gap-2 px-3 py-2 w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={cn("w-4 h-4 transition-transform", labelsOpen && "rotate-180")} />
            <Tag className="w-4 h-4" />
            Labels
          </button>
          {labelsOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-1 space-y-1">
              {labels.map((label) => (
                <button 
                  key={label.id} 
                  onClick={() => onLabelClick?.(label)}
                  className="sidebar-item w-full text-left"
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                  <span className="text-sm">{label.name}</span>
                </button>
              ))}
              <button 
                onClick={onManageLabels}
                className="sidebar-item w-full text-left text-muted-foreground hover:text-foreground"
              >
                <Settings2 className="w-4 h-4" />
                <span className="text-sm">Manage labels</span>
              </button>
            </motion.div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Integrations</h3>
          <div className="space-y-1">
            <button onClick={onCalendarClick} className="sidebar-item w-full text-left">
              <Calendar className="w-5 h-5" />
              <span className="text-sm">Calendar</span>
            </button>
            <button onClick={onTasksClick} className="sidebar-item w-full text-left">
              <CheckSquare className="w-5 h-5" />
              <span className="text-sm">Tasks</span>
            </button>
            <button className="sidebar-item w-full text-left">
              <Cloud className="w-5 h-5" />
              <span className="text-sm">Cloud</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">AI Powered</span>
          </div>
          <p className="text-xs text-muted-foreground">4.2 hours saved this week</p>
        </div>
      </div>
    </aside>
  );
}
