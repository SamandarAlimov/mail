import { useState } from "react";
import { Tag, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/hooks/useLabels";
import { cn } from "@/lib/utils";

interface LabelSelectorProps {
  labels: Label[];
  selectedLabels: string[];
  onToggleLabel: (labelName: string) => void;
  onManageLabels?: () => void;
}

export function LabelSelector({ 
  labels, 
  selectedLabels, 
  onToggleLabel, 
  onManageLabels 
}: LabelSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:text-primary">
          <Tag className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-card border-border z-50">
        <div className="px-2 py-1.5 text-sm font-semibold text-foreground">
          Apply Labels
        </div>
        <DropdownMenuSeparator />
        {labels.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground text-center">
            No labels created yet
          </div>
        ) : (
          labels.map((label) => {
            const isSelected = selectedLabels.includes(label.name);
            return (
              <DropdownMenuItem
                key={label.id}
                onClick={() => onToggleLabel(label.name)}
                className="cursor-pointer flex items-center gap-2"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <span className="flex-1">{label.name}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </DropdownMenuItem>
            );
          })
        )}
        {onManageLabels && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setOpen(false);
                onManageLabels();
              }}
              className="cursor-pointer flex items-center gap-2 text-muted-foreground"
            >
              <Plus className="w-4 h-4" />
              <span>Manage labels</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
