import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Pencil, Trash2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Label as LabelType } from "@/hooks/useLabels";
import { cn } from "@/lib/utils";

interface LabelsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: LabelType[];
  onCreateLabel: (name: string, color: string) => Promise<{ error?: any }>;
  onUpdateLabel: (id: string, updates: { name?: string; color?: string }) => Promise<{ error?: any }>;
  onDeleteLabel: (id: string) => Promise<{ error?: any }>;
}

const PRESET_COLORS = [
  "#f26c21", // Alsamos Orange
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#d946ef", // Fuchsia
  "#ec4899", // Pink
];

export function LabelsManager({
  open,
  onOpenChange,
  labels,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
}: LabelsManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0]);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    setSaving(true);
    const { error } = await onCreateLabel(newLabelName, newLabelColor);
    if (!error) {
      setNewLabelName("");
      setNewLabelColor(PRESET_COLORS[0]);
      setIsCreating(false);
    }
    setSaving(false);
  };

  const handleStartEdit = (label: LabelType) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    const { error } = await onUpdateLabel(editingId, { name: editName, color: editColor });
    if (!error) {
      setEditingId(null);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    await onDeleteLabel(id);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Manage Labels</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Existing labels */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {labels.map((label) => (
                <motion.div
                  key={label.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
                >
                  {editingId === label.id ? (
                    <>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 flex-1"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          {PRESET_COLORS.slice(0, 6).map((color) => (
                            <button
                              key={color}
                              onClick={() => setEditColor(color)}
                              className={cn(
                                "w-5 h-5 rounded-full transition-transform",
                                editColor === color && "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="flex-1 text-sm font-medium">{label.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(label)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(label.id)}
                          disabled={saving}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {labels.length === 0 && !isCreating && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No labels yet. Create one to get started.
              </p>
            )}
          </div>

          {/* Create new label form */}
          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 p-4 rounded-lg border border-border bg-muted/30"
              >
                <div className="space-y-2">
                  <Label htmlFor="label-name">Label name</Label>
                  <Input
                    id="label-name"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Enter label name..."
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewLabelColor(color)}
                        className={cn(
                          "w-7 h-7 rounded-full transition-transform hover:scale-110",
                          newLabelColor === color && "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateLabel}
                    disabled={!newLabelName.trim() || saving}
                    className="bg-primary text-primary-foreground"
                  >
                    Create Label
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add label button */}
          {!isCreating && (
            <Button
              variant="outline"
              onClick={() => setIsCreating(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Label
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
