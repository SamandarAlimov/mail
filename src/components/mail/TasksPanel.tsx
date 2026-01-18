import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckSquare,
  Circle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TasksPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const tasks = [
  {
    id: "1",
    title: "Review Q4 Infrastructure Report",
    source: "Extracted from email",
    priority: "high",
    dueDate: "Today",
    completed: false,
    emailId: "1"
  },
  {
    id: "2",
    title: "Sign off on Phase 2 rollout",
    source: "Extracted from email",
    priority: "high",
    dueDate: "Today",
    completed: false,
    emailId: "1"
  },
  {
    id: "3",
    title: "Review partnership proposal",
    source: "Extracted from email",
    priority: "medium",
    dueDate: "Tomorrow",
    completed: false,
    emailId: "2"
  },
  {
    id: "4",
    title: "Schedule Series C follow-up call",
    source: "Extracted from email",
    priority: "high",
    dueDate: "Tomorrow",
    completed: false,
    emailId: "7"
  },
  {
    id: "5",
    title: "Complete security training",
    source: "Extracted from email",
    priority: "low",
    dueDate: "This week",
    completed: false,
    emailId: "6"
  },
  {
    id: "6",
    title: "Review dashboard mockups",
    source: "Extracted from email",
    priority: "medium",
    dueDate: "Thursday",
    completed: true,
    emailId: "5"
  }
];

export function TasksPanel({ isOpen, onClose }: TasksPanelProps) {
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-[420px] bg-card border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Tasks</h2>
                  <p className="text-sm text-muted-foreground">
                    {pendingTasks.length} pending · {completedTasks.length} completed
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* AI Banner */}
            <div className="mx-6 mt-4 glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">AI Extracted</span>
              </div>
              <p className="text-xs text-muted-foreground">
                These tasks were automatically extracted from your emails using AI. Click on a task to view the source email.
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Pending Tasks</h3>
                <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>

              <div className="space-y-2 mb-8">
                {pendingTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    whileHover={{ scale: 1.01 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group"
                  >
                    <button className="mt-0.5">
                      <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{task.title}</span>
                        {task.priority === "high" && (
                          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded",
                          task.priority === "high" && "bg-destructive/20 text-destructive",
                          task.priority === "medium" && "bg-amber-500/20 text-amber-400",
                          task.priority === "low" && "bg-emerald-500/20 text-emerald-400"
                        )}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>

              <Separator className="mb-6" />

              <h3 className="font-semibold mb-4 text-muted-foreground">Completed</h3>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-xl opacity-60"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm line-through">{task.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <Button variant="secondary" className="w-full">
                Open Tasks
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
