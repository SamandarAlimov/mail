import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Sparkles,
  Palette,
  Bell,
  Filter,
  FileText,
  Key,
  Globe,
  Smartphone,
  LogOut,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  Edit2,
  Moon,
  Sun,
  Monitor,
  Save,
  Copy,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import alsamosLogo from "@/assets/alsamos-logo.png";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, Signature, FilterRule, NotificationPreferences } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

interface SettingsPageProps {
  onBack: () => void;
}

const menuItems = [
  { id: "account", icon: User, label: "Account" },
  { id: "email", icon: Mail, label: "Email & Aliases" },
  { id: "signature", icon: FileText, label: "Signatures" },
  { id: "filters", icon: Filter, label: "Filters & Rules" },
  { id: "ai", icon: Sparkles, label: "AI Preferences" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "appearance", icon: Palette, label: "Appearance" },
  { id: "security", icon: Shield, label: "Security" },
  { id: "language", icon: Globe, label: "Language & Region" },
  { id: "devices", icon: Smartphone, label: "Connected Devices" },
];

// Types imported from useProfile

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState("account");
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();

  // Account state
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  // Signatures state
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [editingSignature, setEditingSignature] = useState<Signature | null>(null);
  const [newSignatureName, setNewSignatureName] = useState("");
  const [newSignatureContent, setNewSignatureContent] = useState("");

  // Filters state
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [newFilterName, setNewFilterName] = useState("");
  const [newFilterCondition, setNewFilterCondition] = useState("");
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
  const [editFilterName, setEditFilterName] = useState("");
  const [editFilterCondition, setEditFilterCondition] = useState("");
  const [editFilterAction, setEditFilterAction] = useState("");
  const [newFilterAction, setNewFilterAction] = useState("");

  // AI Preferences state
  const [aiPreferences, setAiPreferences] = useState({
    smartReply: true,
    autoCateg: true,
    priorityInbox: true,
    taskExtraction: true,
    writingAssistance: true,
    spamDetection: true,
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailNotifs: true,
    desktopNotifs: false,
    soundNotifs: true,
    mentionNotifs: true,
    digestEmail: false,
  });

  // Appearance state
  const [appearance, setAppearance] = useState({
    compactMode: false,
    readingPane: true,
    animations: true,
  });

  // Language state
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("America/Los_Angeles");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");

  // Initialize from profile
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || user?.email?.split("@")[0] || "");
      if (profile.preferences) {
        setAppearance(prev => ({
          ...prev,
          compactMode: profile.preferences.compactMode ?? false,
        }));
        setAiPreferences(prev => ({
          ...prev,
          smartReply: profile.preferences.aiEnabled ?? true,
        }));
      }
      // Load persisted data
      if (profile.signatures && profile.signatures.length > 0) {
        setSignatures(profile.signatures);
      }
      if (profile.email_filters && profile.email_filters.length > 0) {
        setFilters(profile.email_filters);
      }
      if (profile.notification_preferences) {
        setNotifications({
          emailNotifs: profile.notification_preferences.emailNotifications ?? true,
          desktopNotifs: profile.notification_preferences.desktopNotifications ?? false,
          soundNotifs: profile.notification_preferences.soundAlerts ?? true,
          mentionNotifs: true,
          digestEmail: profile.notification_preferences.dailyDigest ?? false,
        });
      }
    } else if (user) {
      setDisplayName(user.email?.split("@")[0] || "");
    }
  }, [profile, user]);

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      await updateProfile({ display_name: displayName });
      toast({
        title: "Account saved",
        description: "Your account information has been updated.",
      });
    } catch (error) {
      console.error("Failed to save account:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSignature = async () => {
    if (!newSignatureName.trim()) return;
    const newSig: Signature = {
      id: Date.now().toString(),
      name: newSignatureName,
      content: newSignatureContent,
      isDefault: signatures.length === 0,
    };
    const updatedSignatures = [...signatures, newSig];
    setSignatures(updatedSignatures);
    setNewSignatureName("");
    setNewSignatureContent("");
    await updateProfile({ signatures: updatedSignatures });
  };

  const handleDeleteSignature = async (id: string) => {
    const updatedSignatures = signatures.filter(s => s.id !== id);
    setSignatures(updatedSignatures);
    await updateProfile({ signatures: updatedSignatures });
  };

  const handleSetDefaultSignature = async (id: string) => {
    const updatedSignatures = signatures.map(s => ({ ...s, isDefault: s.id === id }));
    setSignatures(updatedSignatures);
    await updateProfile({ signatures: updatedSignatures });
  };

  const handleSaveSignature = async () => {
    if (!editingSignature) return;
    const updatedSignatures = signatures.map(s => 
      s.id === editingSignature.id ? editingSignature : s
    );
    setSignatures(updatedSignatures);
    setEditingSignature(null);
    await updateProfile({ signatures: updatedSignatures });
  };

  const handleToggleFilter = async (id: string) => {
    const updatedFilters = filters.map(f => 
      f.id === id ? { ...f, enabled: !f.enabled } : f
    );
    setFilters(updatedFilters);
    await updateProfile({ email_filters: updatedFilters });
  };

  const handleDeleteFilter = async (id: string) => {
    const updatedFilters = filters.filter(f => f.id !== id);
    setFilters(updatedFilters);
    await updateProfile({ email_filters: updatedFilters });
  };

  const handleDuplicateFilter = async (filter: FilterRule) => {
    const duplicatedFilter: FilterRule = {
      id: Date.now().toString(),
      name: `${filter.name} (Copy)`,
      condition: filter.condition,
      action: filter.action,
      enabled: filter.enabled,
    };
    const updatedFilters = [...filters, duplicatedFilter];
    setFilters(updatedFilters);
    await updateProfile({ email_filters: updatedFilters });
    toast({
      title: "Filter duplicated",
      description: `"${duplicatedFilter.name}" has been created.`,
    });
  };

  const handleAddFilter = async () => {
    if (!newFilterName.trim() || !newFilterCondition.trim() || !newFilterAction.trim()) return;
    const newFilter: FilterRule = {
      id: Date.now().toString(),
      name: newFilterName,
      condition: newFilterCondition,
      action: newFilterAction,
      enabled: true,
    };
    const updatedFilters = [...filters, newFilter];
    setFilters(updatedFilters);
    setNewFilterName("");
    setNewFilterCondition("");
    setNewFilterAction("");
    await updateProfile({ email_filters: updatedFilters });
    toast({
      title: "Filter created",
      description: `"${newFilter.name}" has been added to your filters.`,
    });
  };

  const handleEditFilter = (filter: FilterRule) => {
    setEditingFilterId(filter.id);
    setEditFilterName(filter.name);
    setEditFilterCondition(filter.condition);
    setEditFilterAction(filter.action);
  };

  const handleSaveEditFilter = async () => {
    if (!editingFilterId || !editFilterName.trim() || !editFilterCondition.trim() || !editFilterAction.trim()) return;
    const updatedFilters = filters.map(f => 
      f.id === editingFilterId 
        ? { ...f, name: editFilterName, condition: editFilterCondition, action: editFilterAction }
        : f
    );
    setFilters(updatedFilters);
    setEditingFilterId(null);
    setEditFilterName("");
    setEditFilterCondition("");
    setEditFilterAction("");
    await updateProfile({ email_filters: updatedFilters });
    toast({
      title: "Filter updated",
      description: `"${editFilterName}" has been saved.`,
    });
  };

  const handleCancelEditFilter = () => {
    setEditingFilterId(null);
    setEditFilterName("");
    setEditFilterCondition("");
    setEditFilterAction("");
  };

  const [draggedFilterId, setDraggedFilterId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, filterId: string) => {
    setDraggedFilterId(filterId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetFilterId: string) => {
    e.preventDefault();
    if (!draggedFilterId || draggedFilterId === targetFilterId) {
      setDraggedFilterId(null);
      return;
    }

    const draggedIndex = filters.findIndex(f => f.id === draggedFilterId);
    const targetIndex = filters.findIndex(f => f.id === targetFilterId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedFilterId(null);
      return;
    }

    const newFilters = [...filters];
    const [draggedFilter] = newFilters.splice(draggedIndex, 1);
    newFilters.splice(targetIndex, 0, draggedFilter);

    setFilters(newFilters);
    setDraggedFilterId(null);
    await updateProfile({ email_filters: newFilters });
    toast({
      title: "Filters reordered",
      description: "Filter priority has been updated.",
    });
  };

  const handleDragEnd = () => {
    setDraggedFilterId(null);
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await updateProfile({
        preferences: {
          theme,
          compactMode: appearance.compactMode,
          aiEnabled: aiPreferences.smartReply,
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await updateProfile({
        notification_preferences: {
          emailNotifications: notifications.emailNotifs,
          desktopNotifications: notifications.desktopNotifs,
          soundAlerts: notifications.soundNotifs,
          dailyDigest: notifications.digestEmail,
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Account</h2>
              <p className="text-muted-foreground">Manage your Alsamos account settings</p>
            </div>

            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {displayName?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "JD"}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{displayName || user?.email?.split("@")[0] || "User"}</h3>
                  <p className="text-muted-foreground">{user?.email || "user@alsamos.com"}</p>
                  <Button variant="link" className="p-0 h-auto text-primary">
                    Change avatar
                  </Button>
                </div>
              </div>
              <Separator className="mb-6" />
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Full Name</label>
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-secondary" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input value={user?.email || ""} className="bg-secondary" disabled />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <Input 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Product Manager"
                    className="bg-secondary" 
                  />
                </div>
                <Button 
                  onClick={handleSaveAccount} 
                  disabled={saving}
                  className="w-fit gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">Account Management</h3>
              <div className="space-y-3">
                <Button variant="secondary" className="w-full justify-between">
                  Manage at accounts.alsamos.com
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full justify-between text-destructive hover:text-destructive"
                  onClick={() => signOut()}
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Email & Aliases</h2>
              <p className="text-muted-foreground">Manage your email addresses</p>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">Primary Email</h3>
              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <span>{user?.email}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Primary</span>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">Email Aliases</h3>
              <p className="text-sm text-muted-foreground mb-4">Create aliases to organize your inbox</p>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Alias
              </Button>
            </div>
          </div>
        );

      case "signature":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Signatures</h2>
              <p className="text-muted-foreground">Create and manage email signatures</p>
            </div>

            {/* Add New Signature */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">Create New Signature</h3>
              <div className="space-y-4">
                <Input 
                  placeholder="Signature name"
                  value={newSignatureName}
                  onChange={(e) => setNewSignatureName(e.target.value)}
                  className="bg-secondary"
                />
                <Textarea 
                  placeholder="Signature content..."
                  value={newSignatureContent}
                  onChange={(e) => setNewSignatureContent(e.target.value)}
                  className="bg-secondary min-h-[100px]"
                />
                <Button onClick={handleAddSignature} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Signature
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {signatures.map((sig) => (
                <div key={sig.id} className="glass-card rounded-xl p-6">
                  {editingSignature?.id === sig.id ? (
                    <div className="space-y-4">
                      <Input 
                        value={editingSignature.name}
                        onChange={(e) => setEditingSignature({...editingSignature, name: e.target.value})}
                        className="bg-secondary"
                      />
                      <Textarea 
                        value={editingSignature.content}
                        onChange={(e) => setEditingSignature({...editingSignature, content: e.target.value})}
                        className="bg-secondary min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSaveSignature}>Save</Button>
                        <Button variant="ghost" onClick={() => setEditingSignature(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{sig.name}</h3>
                          {sig.isDefault && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!sig.isDefault && (
                            <Button variant="ghost" size="sm" onClick={() => handleSetDefaultSignature(sig.id)}>
                              Set Default
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => setEditingSignature(sig)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDeleteSignature(sig.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans bg-secondary/50 rounded-lg p-4">
                        {sig.content}
                      </pre>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "filters":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Filters & Rules</h2>
              <p className="text-muted-foreground">Automate your inbox with custom rules</p>
            </div>

            {/* Create New Filter */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">Create New Filter</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter Name</label>
                  <Input 
                    placeholder="e.g., Move newsletters to folder"
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                    className="bg-secondary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Condition</label>
                  <Select value={newFilterCondition} onValueChange={setNewFilterCondition}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Select a condition..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="from:newsletter">From contains "newsletter"</SelectItem>
                      <SelectItem value="from:noreply">From contains "noreply"</SelectItem>
                      <SelectItem value="subject:urgent">Subject contains "urgent"</SelectItem>
                      <SelectItem value="subject:invoice">Subject contains "invoice"</SelectItem>
                      <SelectItem value="has:attachment">Has attachment</SelectItem>
                      <SelectItem value="to:me">Sent directly to me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Action</label>
                  <Select value={newFilterAction} onValueChange={setNewFilterAction}>
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Select an action..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="archive">Archive</SelectItem>
                      <SelectItem value="star">Mark as starred</SelectItem>
                      <SelectItem value="read">Mark as read</SelectItem>
                      <SelectItem value="label:important">Apply label: Important</SelectItem>
                      <SelectItem value="label:work">Apply label: Work</SelectItem>
                      <SelectItem value="folder:newsletters">Move to: Newsletters</SelectItem>
                      <SelectItem value="folder:receipts">Move to: Receipts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddFilter} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Filter
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {filters.map((filter) => (
                <div 
                  key={filter.id} 
                  className={cn(
                    "glass-card rounded-xl p-6 transition-all",
                    draggedFilterId === filter.id && "opacity-50 scale-95",
                    draggedFilterId && draggedFilterId !== filter.id && "border-2 border-dashed border-primary/30"
                  )}
                  draggable={editingFilterId !== filter.id}
                  onDragStart={(e) => handleDragStart(e, filter.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, filter.id)}
                  onDragEnd={handleDragEnd}
                >
                  {editingFilterId === filter.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Filter Name</label>
                        <Input 
                          value={editFilterName}
                          onChange={(e) => setEditFilterName(e.target.value)}
                          className="bg-secondary"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Condition</label>
                        <Select value={editFilterCondition} onValueChange={setEditFilterCondition}>
                          <SelectTrigger className="bg-secondary">
                            <SelectValue placeholder="Select a condition..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="from:newsletter">From contains "newsletter"</SelectItem>
                            <SelectItem value="from:noreply">From contains "noreply"</SelectItem>
                            <SelectItem value="subject:urgent">Subject contains "urgent"</SelectItem>
                            <SelectItem value="subject:invoice">Subject contains "invoice"</SelectItem>
                            <SelectItem value="has:attachment">Has attachment</SelectItem>
                            <SelectItem value="to:me">Sent directly to me</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Action</label>
                        <Select value={editFilterAction} onValueChange={setEditFilterAction}>
                          <SelectTrigger className="bg-secondary">
                            <SelectValue placeholder="Select an action..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="archive">Archive</SelectItem>
                            <SelectItem value="star">Mark as starred</SelectItem>
                            <SelectItem value="read">Mark as read</SelectItem>
                            <SelectItem value="label:important">Apply label: Important</SelectItem>
                            <SelectItem value="label:work">Apply label: Work</SelectItem>
                            <SelectItem value="folder:newsletters">Move to: Newsletters</SelectItem>
                            <SelectItem value="folder:receipts">Move to: Receipts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveEditFilter} size="sm">Save</Button>
                        <Button onClick={handleCancelEditFilter} variant="outline" size="sm">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <Switch 
                            checked={filter.enabled}
                            onCheckedChange={() => handleToggleFilter(filter.id)}
                          />
                          <h3 className="font-semibold">{filter.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleDuplicateFilter(filter)} title="Duplicate filter">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditFilter(filter)} title="Edit filter">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDeleteFilter(filter.id)} title="Delete filter">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1 pl-16">
                        <p><span className="font-medium">If:</span> {filter.condition}</p>
                        <p><span className="font-medium">Then:</span> {filter.action}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">AI Preferences</h2>
              <p className="text-muted-foreground">Configure AI-powered features</p>
            </div>

            <div className="glass-card rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Smart Reply Suggestions</h3>
                  <p className="text-sm text-muted-foreground">Show AI-generated reply options</p>
                </div>
                <Switch 
                  checked={aiPreferences.smartReply}
                  onCheckedChange={(checked) => setAiPreferences(p => ({ ...p, smartReply: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Auto-categorization</h3>
                  <p className="text-sm text-muted-foreground">Automatically categorize incoming emails</p>
                </div>
                <Switch 
                  checked={aiPreferences.autoCateg}
                  onCheckedChange={(checked) => setAiPreferences(p => ({ ...p, autoCateg: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Priority Inbox</h3>
                  <p className="text-sm text-muted-foreground">AI-powered email prioritization</p>
                </div>
                <Switch 
                  checked={aiPreferences.priorityInbox}
                  onCheckedChange={(checked) => setAiPreferences(p => ({ ...p, priorityInbox: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Task Extraction</h3>
                  <p className="text-sm text-muted-foreground">Automatically extract tasks from emails</p>
                </div>
                <Switch 
                  checked={aiPreferences.taskExtraction}
                  onCheckedChange={(checked) => setAiPreferences(p => ({ ...p, taskExtraction: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Writing Assistance</h3>
                  <p className="text-sm text-muted-foreground">AI help while composing emails</p>
                </div>
                <Switch 
                  checked={aiPreferences.writingAssistance}
                  onCheckedChange={(checked) => setAiPreferences(p => ({ ...p, writingAssistance: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Spam & Phishing Detection</h3>
                  <p className="text-sm text-muted-foreground">Enhanced AI-powered protection</p>
                </div>
                <Switch 
                  checked={aiPreferences.spamDetection}
                  onCheckedChange={(checked) => setAiPreferences(p => ({ ...p, spamDetection: checked }))}
                />
              </div>
            </div>

            <Button onClick={handleSavePreferences} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Preferences"}
            </Button>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">AI Usage This Month</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">847</p>
                  <p className="text-xs text-muted-foreground">Emails Processed</p>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">4.2h</p>
                  <p className="text-xs text-muted-foreground">Time Saved</p>
                </div>
                <div className="text-center p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">89</p>
                  <p className="text-xs text-muted-foreground">Spam Blocked</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Notifications</h2>
              <p className="text-muted-foreground">Control how you receive notifications</p>
            </div>

            <div className="glass-card rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive notifications for new emails</p>
                </div>
                <Switch 
                  checked={notifications.emailNotifs}
                  onCheckedChange={(checked) => setNotifications(p => ({ ...p, emailNotifs: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Desktop Notifications</h3>
                  <p className="text-sm text-muted-foreground">Show browser notifications</p>
                </div>
                <Switch 
                  checked={notifications.desktopNotifs}
                  onCheckedChange={(checked) => setNotifications(p => ({ ...p, desktopNotifs: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sound Notifications</h3>
                  <p className="text-sm text-muted-foreground">Play sound for new emails</p>
                </div>
                <Switch 
                  checked={notifications.soundNotifs}
                  onCheckedChange={(checked) => setNotifications(p => ({ ...p, soundNotifs: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Mention Notifications</h3>
                  <p className="text-sm text-muted-foreground">Notify when someone mentions you</p>
                </div>
                <Switch 
                  checked={notifications.mentionNotifs}
                  onCheckedChange={(checked) => setNotifications(p => ({ ...p, mentionNotifs: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Daily Digest Email</h3>
                  <p className="text-sm text-muted-foreground">Receive a daily summary of activity</p>
                </div>
                <Switch 
                  checked={notifications.digestEmail}
                  onCheckedChange={(checked) => setNotifications(p => ({ ...p, digestEmail: checked }))}
                />
              </div>
            </div>

            <Button onClick={handleSaveNotifications} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Notifications"}
            </Button>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Appearance</h2>
              <p className="text-muted-foreground">Customize the look and feel</p>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">Theme</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "light", icon: Sun, label: "Light" },
                  { id: "dark", icon: Moon, label: "Dark" },
                  { id: "system", icon: Monitor, label: "System" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id as typeof theme)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                      theme === option.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <option.icon className={cn(
                      "w-6 h-6",
                      theme === option.id && "text-primary"
                    )} />
                    <span className="text-sm font-medium">{option.label}</span>
                    {theme === option.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Compact Mode</h3>
                  <p className="text-sm text-muted-foreground">Show more emails on screen</p>
                </div>
                <Switch 
                  checked={appearance.compactMode}
                  onCheckedChange={(checked) => setAppearance(p => ({ ...p, compactMode: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Reading Pane</h3>
                  <p className="text-sm text-muted-foreground">Show email preview on the right</p>
                </div>
                <Switch 
                  checked={appearance.readingPane}
                  onCheckedChange={(checked) => setAppearance(p => ({ ...p, readingPane: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Animations</h3>
                  <p className="text-sm text-muted-foreground">Enable UI animations</p>
                </div>
                <Switch 
                  checked={appearance.animations}
                  onCheckedChange={(checked) => setAppearance(p => ({ ...p, animations: checked }))}
                />
              </div>
            </div>

            <Button onClick={handleSavePreferences} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        );

      case "security":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Security</h2>
              <p className="text-muted-foreground">Protect your account and data</p>
            </div>

            <div className="glass-card rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Enabled via authenticator app</p>
                  </div>
                </div>
                <Button variant="secondary">Manage</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Password</h3>
                    <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                  </div>
                </div>
                <Button variant="secondary">Change</Button>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">Active Sessions</h3>
              <div className="space-y-4">
                {[
                  { device: "MacBook Pro", location: "San Francisco, CA", current: true },
                  { device: "iPhone 15 Pro", location: "San Francisco, CA", current: false },
                  { device: "Windows Desktop", location: "New York, NY", current: false },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {session.device}
                          {session.current && (
                            <span className="ml-2 text-xs text-primary">(This device)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{session.location}</p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => toast({ title: "Session revoked" })}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold mb-4">Security Log</h3>
              <div className="space-y-3">
                {[
                  { action: "Sign in", time: "2 hours ago", location: "San Francisco, CA" },
                  { action: "Password changed", time: "30 days ago", location: "San Francisco, CA" },
                  { action: "2FA enabled", time: "45 days ago", location: "San Francisco, CA" },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{log.action}</span>
                    <span className="text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "language":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Language & Region</h2>
              <p className="text-muted-foreground">Set your language and regional preferences</p>
            </div>

            <div className="glass-card rounded-xl p-6 space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="uz">O'zbek</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium mb-2 block">Timezone</label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                    <SelectItem value="Asia/Tashkent">Uzbekistan Time (UZT)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium mb-2 block">Date Format</label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case "devices":
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Connected Devices</h2>
              <p className="text-muted-foreground">Manage devices connected to your account</p>
            </div>

            <div className="glass-card rounded-xl p-6">
              <div className="space-y-4">
                {[
                  { name: "MacBook Pro 16\"", type: "Desktop", lastActive: "Active now", current: true },
                  { name: "iPhone 15 Pro", type: "Mobile", lastActive: "2 hours ago", current: false },
                  { name: "iPad Pro", type: "Tablet", lastActive: "Yesterday", current: false },
                ].map((device, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {device.name}
                          {device.current && (
                            <span className="ml-2 text-xs text-primary">(Current)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{device.type} • {device.lastActive}</p>
                      </div>
                    </div>
                    {!device.current && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => toast({ title: "Device removed" })}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a section from the menu</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen flex flex-col bg-background"
    >
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-xl">
        <Button variant="ghost" onClick={onBack} className="gap-2 mr-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Inbox
        </Button>
        <div className="flex items-center gap-3">
          <img src={alsamosLogo} alt="Alsamos" className="w-8 h-8" />
          <h1 className="font-semibold">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-card/30 p-4 overflow-y-auto">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  activeSection === item.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl">
            {renderContent()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
