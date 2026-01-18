import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { MailHeader } from "@/components/mail/MailHeader";
import { MailSidebar, FolderCounts } from "@/components/mail/MailSidebar";
import { ThreadList } from "@/components/mail/ThreadList";
import { ThreadView } from "@/components/mail/ThreadView";
import { ComposeModal, DraftData } from "@/components/mail/ComposeModal";
import { DraftsList, Draft } from "@/components/mail/DraftsList";
import { ScheduledEmailsList, ScheduledEmail } from "@/components/mail/ScheduledEmailsList";
import { CalendarPanel } from "@/components/mail/CalendarPanel";
import { TasksPanel } from "@/components/mail/TasksPanel";
import { AIAssistant } from "@/components/mail/AIAssistant";
import { KeyboardShortcutsModal } from "@/components/mail/KeyboardShortcutsModal";
import { LabelsManager } from "@/components/mail/LabelsManager";
import { SettingsPage } from "@/pages/Settings";
import { AuthPage } from "@/pages/Auth";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useEmails, DbEmail } from "@/hooks/useEmails";
import { useEmailThreads } from "@/hooks/useEmailThreads";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useScheduledEmails } from "@/hooks/useScheduledEmails";
import { useLabels, Label } from "@/hooks/useLabels";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

function useDbEmailFilter(emails: DbEmail[]) {
  const [filters, setFilters] = useState({
    query: "",
    from: "",
    to: "",
    dateFrom: "",
    dateTo: "",
    hasAttachment: "any" as "any" | "yes" | "no",
    labels: [] as string[],
  });

  const updateFilter = <K extends keyof typeof filters>(key: K, value: typeof filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      query: "",
      from: "",
      to: "",
      dateFrom: "",
      dateTo: "",
      hasAttachment: "any",
      labels: [],
    });
  };

  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const matchesQuery =
          email.subject.toLowerCase().includes(query) ||
          (email.snippet?.toLowerCase().includes(query)) ||
          email.from_name.toLowerCase().includes(query) ||
          email.from_email.toLowerCase().includes(query) ||
          email.body.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      if (filters.from) {
        const from = filters.from.toLowerCase();
        const matchesFrom =
          email.from_name.toLowerCase().includes(from) ||
          email.from_email.toLowerCase().includes(from);
        if (!matchesFrom) return false;
      }

      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom);
        if (new Date(email.timestamp) < dateFrom) return false;
      }

      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        if (new Date(email.timestamp) > dateTo) return false;
      }

      if (filters.hasAttachment === "yes" && (!email.attachments || email.attachments.length === 0)) return false;
      if (filters.hasAttachment === "no" && email.attachments && email.attachments.length > 0) return false;

      if (filters.labels.length > 0 && email.labels) {
        const hasMatchingLabel = filters.labels.some((label) =>
          email.labels.some((emailLabel) =>
            emailLabel.toLowerCase().includes(label.toLowerCase())
          )
        );
        if (!hasMatchingLabel) return false;
      }

      return true;
    });
  }, [emails, filters]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.query !== "" ||
      filters.from !== "" ||
      filters.to !== "" ||
      filters.dateFrom !== "" ||
      filters.dateTo !== "" ||
      filters.hasAttachment !== "any" ||
      filters.labels.length > 0
    );
  }, [filters]);

  return {
    filters,
    filteredEmails,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  };
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const [showSettings, setShowSettings] = useState(false);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isLabelsManagerOpen, setIsLabelsManagerOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<DraftData | null>(null);

  // Drafts state
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  const { emails, loading: emailsLoading, createEmail, updateEmail, deleteEmail, summarizeEmail } = useEmails(activeFolder);
  const { threads } = useEmailThreads(emails);
  const { filters, filteredEmails, updateFilter, resetFilters, hasActiveFilters } = useDbEmailFilter(emails);
  const filteredThreads = useEmailThreads(filteredEmails).threads;
  const [selectedEmail, setSelectedEmail] = useState<DbEmail | null>(null);

  // Scheduled emails
  const { 
    scheduledEmails, 
    loading: scheduledLoading, 
    pendingCount: scheduledCount,
    scheduleEmail, 
    deleteScheduledEmail, 
    sendNow,
    refetch: refetchScheduled 
  } = useScheduledEmails();
  const [selectedScheduledId, setSelectedScheduledId] = useState<string | null>(null);

  // Labels
  const { labels, createLabel, updateLabel, deleteLabel } = useLabels();

  useNotifications();

  // Fetch drafts when in drafts folder
  useEffect(() => {
    const fetchDrafts = async () => {
      if (!user || activeFolder !== "drafts") return;
      
      setDraftsLoading(true);
      const { data, error } = await (supabase
        .from("drafts" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }) as any);

      if (!error && data) {
        setDrafts(data);
      }
      setDraftsLoading(false);
    };

    fetchDrafts();
  }, [user, activeFolder]);

  const handleSelectDraft = (draft: Draft) => {
    setSelectedDraftId(draft.id);
    setEditingDraft({
      id: draft.id,
      to: draft.to_recipients || "",
      cc: draft.cc_recipients || "",
      subject: draft.subject || "",
      body: draft.body || "",
      attachments: draft.attachments || [],
    });
    setIsComposeOpen(true);
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!user) return;
    
    await (supabase
      .from("drafts" as any)
      .delete() as any)
      .eq("id", draftId)
      .eq("user_id", user.id);

    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    if (selectedDraftId === draftId) {
      setSelectedDraftId(null);
    }
    toast.success("Draft deleted");
  };

  const handleComposeClose = () => {
    setIsComposeOpen(false);
    setEditingDraft(null);
    // Refresh drafts if we're in drafts folder
    if (activeFolder === "drafts" && user) {
      (supabase
        .from("drafts" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }) as any)
        .then(({ data }: { data: Draft[] }) => {
          if (data) setDrafts(data);
        });
    }
  };

  // Scheduled email handlers
  const handleSelectScheduled = (email: ScheduledEmail) => {
    setSelectedScheduledId(email.id);
  };

  const handleDeleteScheduled = async (emailId: string) => {
    const { error } = await deleteScheduledEmail(emailId);
    if (!error) {
      toast.success("Scheduled email deleted");
      if (selectedScheduledId === emailId) {
        setSelectedScheduledId(null);
      }
    }
  };

  const handleSendNow = async (email: ScheduledEmail) => {
    const { error } = await sendNow(email);
    if (!error) {
      toast.success("Email sent successfully");
    }
  };

  const handleLabelClick = useCallback((label: Label) => {
    updateFilter("labels", [label.name]);
  }, [updateFilter]);

  // Fetch real folder counts
  const [folderCounts, setFolderCounts] = useState<FolderCounts>({
    inbox: 0,
    starred: 0,
    sent: 0,
    drafts: 0,
    scheduled: 0,
    spam: 0,
    trash: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;
      
      const folders = ["inbox", "starred", "sent", "drafts", "scheduled", "spam", "trash"];
      const counts: Partial<FolderCounts> = {};
      
      for (const folder of folders) {
        if (folder === "starred") {
          const { count } = await supabase
            .from("emails")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_starred", true);
          counts.starred = count || 0;
        } else {
          const { count } = await supabase
            .from("emails")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("folder", folder);
          counts[folder as keyof FolderCounts] = count || 0;
        }
      }
      
      // Get drafts count from drafts table
      const { count: draftsCount } = await supabase
        .from("drafts" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      counts.drafts = draftsCount || 0;

      // Get scheduled count from scheduled_emails table
      const { count: scheduledEmailsCount } = await supabase
        .from("scheduled_emails" as any)
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");
      counts.scheduled = scheduledEmailsCount || 0;
      
      setFolderCounts(counts as FolderCounts);
    };

    fetchCounts();
  }, [user, emails]);

  // Find the thread for the selected email
  const selectedThread = useMemo(() => {
    if (!selectedEmail) return null;
    return filteredThreads.find((t) => t.emails.some((e) => e.id === selectedEmail.id)) || null;
  }, [selectedEmail, filteredThreads]);

  // Update selected email when emails change
  useEffect(() => {
    if (selectedEmail) {
      const updated = emails.find(e => e.id === selectedEmail.id);
      if (updated) {
        setSelectedEmail(updated);
      } else if (filteredThreads.length > 0) {
        setSelectedEmail(filteredThreads[0].latestEmail);
      } else {
        setSelectedEmail(null);
      }
    } else if (filteredThreads.length > 0) {
      setSelectedEmail(filteredThreads[0].latestEmail);
    }
  }, [emails, filteredThreads, selectedEmail?.id]);

  // Keyboard shortcut handlers
  const handleToggleStar = useCallback(async (emailId: string, isStarred: boolean) => {
    return await updateEmail(emailId, { is_starred: isStarred });
  }, [updateEmail]);

  const handleArchive = useCallback(async (emailId: string) => {
    const result = await updateEmail(emailId, { folder: "archive" });
    if (!result.error) {
      toast.success("Email archived");
    }
    return result;
  }, [updateEmail]);

  // Keyboard shortcuts
  const { shortcuts, isHelpOpen, setIsHelpOpen } = useKeyboardShortcuts({
    threads: filteredThreads,
    selectedEmail,
    onSelectEmail: setSelectedEmail,
    onToggleStar: handleToggleStar,
    onArchive: handleArchive,
    onCompose: () => { setEditingDraft(null); setIsComposeOpen(true); },
    enabled: !isComposeOpen && !showSettings,
  });

  const userInitials = useMemo(() => {
    if (profile?.display_name) {
      return profile.display_name.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "JD";
  }, [user, profile]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (showSettings) {
    return <SettingsPage onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <MailHeader 
        onSettingsClick={() => setShowSettings(true)}
        onAIClick={() => setIsAIOpen(true)}
        onKeyboardShortcutsClick={() => setIsHelpOpen(true)}
        filters={filters}
        onUpdateFilter={updateFilter}
        onResetFilters={resetFilters}
        hasActiveFilters={hasActiveFilters}
        userInitials={userInitials}
      />

      <div className="flex-1 flex overflow-hidden">
        <MailSidebar
          activeFolder={activeFolder}
          onFolderChange={setActiveFolder}
          onCompose={() => { setEditingDraft(null); setIsComposeOpen(true); }}
          onCalendarClick={() => setIsCalendarOpen(true)}
          onTasksClick={() => setIsTasksOpen(true)}
          folderCounts={folderCounts}
          labels={labels}
          onManageLabels={() => setIsLabelsManagerOpen(true)}
          onLabelClick={handleLabelClick}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-[400px] border-r border-border bg-background flex flex-col"
        >
          {activeFolder === "drafts" ? (
            <DraftsList
              drafts={drafts}
              selectedDraftId={selectedDraftId}
              onSelectDraft={handleSelectDraft}
              onDeleteDraft={handleDeleteDraft}
              loading={draftsLoading}
            />
          ) : activeFolder === "scheduled" ? (
            <ScheduledEmailsList
              emails={scheduledEmails}
              selectedEmailId={selectedScheduledId}
              onSelectEmail={handleSelectScheduled}
              onDeleteEmail={handleDeleteScheduled}
              onSendNow={handleSendNow}
              loading={scheduledLoading}
            />
          ) : emailsLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : emails.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <Mail className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your inbox is empty</h3>
              <p className="text-sm text-muted-foreground text-center">
                Compose a new email or wait for incoming messages
              </p>
            </div>
          ) : (
            <ThreadList
              threads={filteredThreads}
              selectedEmail={selectedEmail}
              onSelectEmail={setSelectedEmail}
              onUpdateEmail={updateEmail}
              onDeleteEmail={deleteEmail}
              searchQuery={filters.query}
              labels={labels}
            />
          )}
        </motion.div>

        <div className="flex-1 bg-card/20">
          <ThreadView 
            email={selectedEmail}
            thread={selectedThread}
            labels={labels}
            onSummarize={summarizeEmail}
            onDelete={deleteEmail}
            onUpdate={updateEmail}
            onManageLabels={() => setIsLabelsManagerOpen(true)}
          />
        </div>
      </div>

      <ComposeModal 
        isOpen={isComposeOpen} 
        onClose={handleComposeClose} 
        onSend={createEmail}
        onSchedule={scheduleEmail}
        initialDraft={editingDraft}
      />
      <CalendarPanel isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
      <TasksPanel isOpen={isTasksOpen} onClose={() => setIsTasksOpen(false)} />
      <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
      <KeyboardShortcutsModal 
        open={isHelpOpen} 
        onOpenChange={setIsHelpOpen} 
        shortcuts={shortcuts} 
      />
      <LabelsManager
        open={isLabelsManagerOpen}
        onOpenChange={setIsLabelsManagerOpen}
        labels={labels}
        onCreateLabel={createLabel}
        onUpdateLabel={updateLabel}
        onDeleteLabel={deleteLabel}
      />
    </div>
  );
};

export default Index;
