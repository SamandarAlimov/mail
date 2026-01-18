import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Minus,
  Maximize2,
  Paperclip,
  Smile,
  Clock,
  Send,
  Sparkles,
  Wand2,
  ArrowUp,
  ArrowDown,
  Languages,
  MessageSquare,
  ChevronRight,
  Trash2,
  Cloud,
  Loader2,
  FileText,
  CalendarClock,
  ChevronDown,
  Keyboard,
  Minimize2,
  Save,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAttachments, UploadedAttachment } from "@/hooks/useAttachments";
import { DbEmail } from "@/hooks/useEmails";
import { useToast } from "@/hooks/use-toast";
import { useDrafts } from "@/hooks/useDrafts";
import { format, addDays, setHours, setMinutes, formatDistanceToNow } from "date-fns";
import { RichTextEditor } from "./RichTextEditor";
import { ContactAutocomplete } from "./ContactAutocomplete";

export interface DraftData {
  id?: string;
  to: string;
  cc: string;
  subject: string;
  body: string;
  attachments?: Array<{ name: string; size: string; type: string; path?: string }>;
}

interface ScheduleEmailData {
  to_recipients: Array<{ name: string; email: string }>;
  cc_recipients?: Array<{ name: string; email: string }>;
  subject: string;
  body: string;
  attachments?: Array<{ name: string; size: string; type: string; path?: string }>;
  scheduled_at: Date;
}

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend?: (emailData: Omit<DbEmail, "id" | "user_id" | "created_at" | "updated_at">) => Promise<{ error: Error | null }>;
  onSchedule?: (data: ScheduleEmailData) => Promise<{ error: Error | null }>;
  initialDraft?: DraftData | null;
}

const aiSuggestions = [
  { icon: Wand2, label: "Write email", description: "Generate from prompt" },
  { icon: ArrowUp, label: "Make professional", description: "Formal tone" },
  { icon: ArrowDown, label: "Make shorter", description: "Condense text" },
  { icon: Languages, label: "Translate", description: "Any language" },
  { icon: MessageSquare, label: "Generate subject", description: "Smart subject line" },
];

const timeOptions = [
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
];

export function ComposeModal({ isOpen, onClose, onSend, onSchedule, initialDraft }: ComposeModalProps) {
  const { toast } = useToast();
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { uploading, uploadAttachment, deleteAttachment } = useAttachments();
  const { saving, lastSaved, saveDraft, clearDraft, resetDraft, setCurrentDraftId } = useDrafts();

  // Load initial draft data when provided
  useEffect(() => {
    if (isOpen && initialDraft) {
      setTo(initialDraft.to || "");
      setCc(initialDraft.cc || "");
      setSubject(initialDraft.subject || "");
      setBody(initialDraft.body || "");
      setAttachments(
        (initialDraft.attachments || []).map((a) => ({
          name: a.name,
          size: a.size,
          type: a.type,
          path: a.path,
          url: "",
        }))
      );
      if (initialDraft.id) {
        setEditingDraftId(initialDraft.id);
        setCurrentDraftId(initialDraft.id);
      }
    } else if (isOpen && !initialDraft) {
      // New compose - reset everything
      setTo("");
      setCc("");
      setSubject("");
      setBody("");
      setAttachments([]);
      setEditingDraftId(null);
      resetDraft();
    }
  }, [isOpen, initialDraft, resetDraft, setCurrentDraftId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const uploaded = await uploadAttachment(file);
      if (uploaded) {
        setAttachments((prev) => [...prev, uploaded]);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = async (index: number) => {
    const attachment = attachments[index];
    if (attachment.path) {
      await deleteAttachment(attachment.path);
    }
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = useCallback(async () => {
    if (!to.trim()) {
      toast({
        title: "Recipient required",
        description: "Please enter at least one recipient.",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: "Subject required",
        description: "Please enter a subject.",
        variant: "destructive",
      });
      return;
    }

    if (!onSend) return;

    setSending(true);

    const toRecipients = to.split(",").map((email) => ({
      name: email.trim().split("@")[0],
      email: email.trim(),
    }));

    const ccRecipients = cc
      ? cc.split(",").map((email) => ({
          name: email.trim().split("@")[0],
          email: email.trim(),
        }))
      : [];

    const emailData: Omit<DbEmail, "id" | "user_id" | "created_at" | "updated_at"> = {
      thread_id: null,
      from_name: "Me",
      from_email: "me@alsamos.com",
      from_avatar: null,
      to_recipients: toRecipients,
      cc_recipients: ccRecipients,
      subject,
      snippet: body.replace(/<[^>]*>/g, "").substring(0, 100),
      body,
      is_read: true,
      is_starred: false,
      is_verified: true,
      priority: "normal",
      folder: "sent",
      labels: [],
      attachments: attachments.map((a) => ({
        name: a.name,
        size: a.size,
        type: a.type,
        path: a.path,
      })),
      ai_summary: null,
      ai_actions: [],
      timestamp: new Date().toISOString(),
    };

    const { error } = await onSend(emailData);

    setSending(false);

    if (!error) {
      setTo("");
      setCc("");
      setSubject("");
      setBody("");
      setAttachments([]);
      setEditingDraftId(null);
      clearDraft(); // Clear the draft when email is sent
      onClose();
    }
  }, [to, subject, cc, body, attachments, onSend, onClose, toast, clearDraft]);

  const handleScheduleSend = useCallback(async () => {
    if (!to.trim()) {
      toast({
        title: "Recipient required",
        description: "Please enter at least one recipient.",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: "Subject required",
        description: "Please enter a subject.",
        variant: "destructive",
      });
      return;
    }

    if (!scheduleDate) {
      toast({
        title: "Date required",
        description: "Please select a date to schedule the email.",
        variant: "destructive",
      });
      return;
    }

    const [hours, minutes] = scheduleTime.split(":").map(Number);
    const scheduledDateTime = setMinutes(setHours(scheduleDate, hours), minutes);

    if (onSchedule) {
      const toRecipients = to.split(",").map((email) => ({
        name: email.trim().split("@")[0],
        email: email.trim(),
      }));

      const ccRecipients = cc
        ? cc.split(",").map((email) => ({
            name: email.trim().split("@")[0],
            email: email.trim(),
          }))
        : [];

      const { error } = await onSchedule({
        to_recipients: toRecipients,
        cc_recipients: ccRecipients,
        subject,
        body,
        attachments: attachments.map((a) => ({
          name: a.name,
          size: a.size,
          type: a.type,
          path: a.path,
        })),
        scheduled_at: scheduledDateTime,
      });

      if (!error) {
        toast({
          title: "Email scheduled",
          description: `Your email will be sent on ${format(scheduledDateTime, "PPP 'at' p")}`,
        });
        setTo("");
        setCc("");
        setSubject("");
        setBody("");
        setAttachments([]);
        setEditingDraftId(null);
        clearDraft();
        setShowScheduleModal(false);
        onClose();
      } else {
        toast({
          title: "Failed to schedule",
          description: "Could not schedule the email. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Email scheduled",
        description: `Your email will be sent on ${format(scheduledDateTime, "PPP 'at' p")}`,
      });
      setShowScheduleModal(false);
    }
  }, [to, cc, subject, body, attachments, scheduleDate, scheduleTime, onSchedule, onClose, toast, clearDraft]);

  const handleQuickSchedule = useCallback(async (preset: "tomorrow_morning" | "tomorrow_afternoon") => {
    if (!to.trim() || !subject.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter recipient and subject first.",
        variant: "destructive",
      });
      return;
    }

    const tomorrow = addDays(new Date(), 1);
    const scheduledTime = preset === "tomorrow_morning" 
      ? setMinutes(setHours(tomorrow, 8), 0)
      : setMinutes(setHours(tomorrow, 13), 0);

    if (onSchedule) {
      const toRecipients = to.split(",").map((email) => ({
        name: email.trim().split("@")[0],
        email: email.trim(),
      }));

      const ccRecipients = cc
        ? cc.split(",").map((email) => ({
            name: email.trim().split("@")[0],
            email: email.trim(),
          }))
        : [];

      const { error } = await onSchedule({
        to_recipients: toRecipients,
        cc_recipients: ccRecipients,
        subject,
        body,
        attachments: attachments.map((a) => ({
          name: a.name,
          size: a.size,
          type: a.type,
          path: a.path,
        })),
        scheduled_at: scheduledTime,
      });

      if (!error) {
        toast({
          title: "Email scheduled",
          description: `Your email will be sent on ${format(scheduledTime, "PPP 'at' p")}`,
        });
        setTo("");
        setCc("");
        setSubject("");
        setBody("");
        setAttachments([]);
        setEditingDraftId(null);
        clearDraft();
        onClose();
      }
    } else {
      toast({
        title: "Email scheduled",
        description: `Your email will be sent on ${format(scheduledTime, "PPP 'at' p")}`,
      });
    }
  }, [to, cc, subject, body, attachments, onSchedule, onClose, toast, clearDraft]);

  const handleDiscard = () => {
    setTo("");
    setCc("");
    setSubject("");
    setBody("");
    setAttachments([]);
    clearDraft(); // Clear auto-saved draft
    onClose();
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setShowScheduleModal(true);
      }
      if (e.key === "Escape" && !showScheduleModal) {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleSend, onClose, showScheduleModal]);

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
          }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          className={cn(
            "fixed z-50 bg-card border border-border rounded-xl shadow-elevated overflow-hidden",
            // Responsive positioning - lifted from bottom for full visibility
            isExpanded 
              ? "inset-4 sm:inset-8" 
              : cn(
                  "bottom-4 sm:bottom-6 right-2 left-2 sm:left-auto sm:right-4 md:right-6",
                  "w-auto sm:w-[480px] md:w-[560px] lg:w-[640px]",
                  isMinimized ? "h-auto" : "max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]"
                )
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-secondary/50 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">New Message</span>
              {/* Auto-save indicator */}
              {(saving || lastSaved) && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {saving ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="hidden sm:inline">Saving...</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span className="hidden sm:inline">Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
                    </>
                  ) : null}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsMinimized(!isMinimized)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-secondary border-border">
                  <p className="text-xs">Minimize</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-secondary border-border">
                  <p className="text-xs">{isExpanded ? "Restore" : "Expand"}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:text-destructive"
                    onClick={onClose}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-secondary border-border">
                  <p className="text-xs">Close (Esc)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {!isMinimized && (
            <div className={cn("flex flex-col sm:flex-row", isExpanded ? "h-[calc(100%-52px)]" : "")}>
              {/* Main Compose Area */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Recipients with Autocomplete */}
                <div className="px-3 sm:px-4 py-2 border-b border-border/50 shrink-0">
                  <ContactAutocomplete
                    value={to}
                    onChange={setTo}
                    placeholder="Recipients"
                    label="To"
                  />
                </div>

                <div className="px-3 sm:px-4 py-2 border-b border-border/50 shrink-0">
                  <ContactAutocomplete
                    value={cc}
                    onChange={setCc}
                    placeholder="Cc recipients"
                    label="Cc"
                  />
                </div>

                <div className="px-3 sm:px-4 py-2 border-b border-border/50 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-10 sm:w-12 shrink-0">Subject</span>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject"
                      className="border-0 bg-transparent p-0 h-8 focus-visible:ring-0 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div className={cn("flex-1 overflow-hidden", isExpanded ? "min-h-0" : "")}>
                  <RichTextEditor
                    value={body}
                    onChange={setBody}
                    placeholder="Write your message..."
                    className={cn(isExpanded ? "h-full [&>div:last-child]:max-h-none [&>div:last-child]:flex-1" : "")}
                  />
                </div>

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="px-3 sm:px-4 py-2 border-t border-border/50 shrink-0">
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((attachment, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-secondary text-sm"
                        >
                          <FileText className="w-4 h-4 shrink-0" />
                          <span className="max-w-[100px] sm:max-w-[150px] truncate">{attachment.name}</span>
                          <span className="text-xs text-muted-foreground hidden sm:inline">{attachment.size}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:text-destructive"
                            onClick={() => handleRemoveAttachment(idx)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <TooltipProvider delayDuration={300}>
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-border flex items-center justify-between gap-2 shrink-0 bg-card">
                    {/* Left side - Send actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      {/* Send Button with Dropdown */}
                      <div className="flex items-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              className="bg-primary hover:bg-primary/90 glow-orange gap-1.5 sm:gap-2 rounded-r-none pr-2 sm:pr-3 h-9 sm:h-10"
                              onClick={handleSend}
                              disabled={sending}
                            >
                              {sending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                              <span className="font-medium text-sm">Send</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-secondary border-border">
                            <div className="flex items-center gap-2">
                              <p className="text-xs">Send email</p>
                              <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded border border-border">
                                <Keyboard className="w-2.5 h-2.5 inline mr-0.5" />
                                ⌘↵
                              </kbd>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                        
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  className="bg-primary hover:bg-primary/90 rounded-l-none border-l border-primary-foreground/20 px-1.5 sm:px-2 h-9 sm:h-10"
                                  disabled={sending}
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-secondary border-border">
                              <p className="text-xs">More options</p>
                            </TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="start" className="w-56 bg-card border-border">
                            <DropdownMenuItem className="gap-3 cursor-pointer" onClick={handleSend}>
                              <Send className="w-4 h-4 text-primary" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">Send now</p>
                                <p className="text-xs text-muted-foreground">Deliver immediately</p>
                              </div>
                              <kbd className="text-[10px] text-muted-foreground">⌘↵</kbd>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-3 cursor-pointer" onClick={() => setShowScheduleModal(true)}>
                              <CalendarClock className="w-4 h-4 text-primary" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">Schedule send</p>
                                <p className="text-xs text-muted-foreground">Pick date & time</p>
                              </div>
                              <kbd className="text-[10px] text-muted-foreground">⌘⇧S</kbd>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-3 cursor-pointer" onClick={() => handleQuickSchedule("tomorrow_morning")}>
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">Tomorrow morning</p>
                                <p className="text-xs text-muted-foreground">8:00 AM</p>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-3 cursor-pointer" onClick={() => handleQuickSchedule("tomorrow_afternoon")}>
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">Tomorrow afternoon</p>
                                <p className="text-xs text-muted-foreground">1:00 PM</p>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Schedule Quick Button */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="border-border hover:bg-secondary hover:border-primary/50 h-9 w-9 sm:h-10 sm:w-10"
                            onClick={() => setShowScheduleModal(true)}
                          >
                            <CalendarClock className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-secondary border-border">
                          <div className="flex items-center gap-2">
                            <p className="text-xs">Schedule send</p>
                            <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded border border-border">⌘⇧S</kbd>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    
                    {/* Right side - Other actions */}
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        multiple
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                          >
                            {uploading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Paperclip className="w-4 h-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-secondary border-border">
                          <p className="text-xs">Attach files</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex">
                            <Cloud className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-secondary border-border">
                          <p className="text-xs">Insert from Cloud</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex">
                            <Smile className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-secondary border-border">
                          <p className="text-xs">Insert emoji</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Separator orientation="vertical" className="h-5 mx-0.5 sm:mx-1 hidden sm:block" />
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 sm:h-9 sm:w-9", showAI && "text-primary bg-primary/10")}
                            onClick={() => setShowAI(!showAI)}
                          >
                            <Sparkles className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-secondary border-border">
                          <p className="text-xs">AI Composer</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 sm:h-9 sm:w-9 hover:text-destructive hover:bg-destructive/10"
                            onClick={handleDiscard}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-secondary border-border">
                          <p className="text-xs">Discard draft</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </TooltipProvider>
              </div>

              {/* AI Sidebar - Hidden on mobile */}
              <AnimatePresence>
                {showAI && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-l border-border bg-secondary/30 overflow-hidden hidden sm:block shrink-0"
                  >
                    <div className="p-4 w-[200px]">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">AI Composer</span>
                      </div>

                      <div className="space-y-2">
                        {aiSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.label}
                            className="w-full text-left p-2 rounded-lg hover:bg-secondary transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <suggestion.icon className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">{suggestion.label}</span>
                              <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 ml-6">
                              {suggestion.description}
                            </p>
                          </button>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      <div className="glass-card rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          Describe what you want to write:
                        </p>
                        <textarea
                          placeholder="e.g., 'Write a follow-up email about the Q4 report'"
                          className="w-full h-20 bg-transparent text-xs resize-none focus:outline-none placeholder:text-muted-foreground/70"
                        />
                        <Button
                          size="sm"
                          className="w-full mt-2 bg-primary hover:bg-primary/90 gap-2"
                        >
                          <Wand2 className="w-3 h-3" />
                          Generate
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Schedule Send Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              Schedule Send
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Calendar */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={scheduleDate}
                onSelect={setScheduleDate}
                disabled={(date) => date < new Date()}
                className="rounded-lg border border-border"
              />
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select time</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeOptions.map((time) => (
                  <Button
                    key={time.value}
                    variant={scheduleTime === time.value ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "text-xs",
                      scheduleTime === time.value && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setScheduleTime(time.value)}
                  >
                    {time.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {scheduleDate && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  Your email will be sent on:
                </p>
                <p className="text-sm font-medium mt-1">
                  {format(scheduleDate, "EEEE, MMMM d, yyyy")} at {timeOptions.find(t => t.value === scheduleTime)?.label}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
              Cancel
            </Button>
            <Button className="bg-primary hover:bg-primary/90 gap-2" onClick={handleScheduleSend}>
              <CalendarClock className="w-4 h-4" />
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
