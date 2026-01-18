import { motion } from "framer-motion";
import { Bell, HelpCircle, Settings, ChevronDown, Grid3X3, Sparkles, Moon, Sun, LogOut, User, Shield, Keyboard, Check, Trash2, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";
import alsamosLogo from "@/assets/alsamos-logo.png";
import { EmailFilters } from "@/hooks/useEmailFilter";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNotificationsDB } from "@/hooks/useNotificationsDB";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

interface MailHeaderProps {
  onSettingsClick?: () => void;
  onAIClick?: () => void;
  onKeyboardShortcutsClick?: () => void;
  filters: EmailFilters;
  onUpdateFilter: <K extends keyof EmailFilters>(key: K, value: EmailFilters[K]) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  userInitials?: string;
}

const appLinks = [
  { name: "Mail", icon: "📧", active: true },
  { name: "Drive", icon: "📁", href: "https://drive.alsamos.com" },
  { name: "Calendar", icon: "📅", href: "https://calendar.alsamos.com" },
  { name: "Contacts", icon: "👥", href: "https://contacts.alsamos.com" },
  { name: "Tasks", icon: "✅", href: "https://tasks.alsamos.com" },
  { name: "Notes", icon: "📝", href: "https://notes.alsamos.com" },
];

export function MailHeader({ 
  onSettingsClick, 
  onAIClick,
  onKeyboardShortcutsClick,
  filters, 
  onUpdateFilter, 
  onResetFilters, 
  hasActiveFilters,
  userInitials = "JD"
}: MailHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotificationsDB();
  const [notificationsOpen, setNotificationsOpen] = useState(false);


  const handleSignOut = async () => {
    await signOut();
  };

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";

  return (
    <TooltipProvider>
      <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-40 gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3 cursor-pointer">
            <img src={alsamosLogo} alt="Alsamos" className="w-9 h-9" />
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg tracking-tight whitespace-nowrap">
                <span className="text-foreground">ALSAMOS</span>
                <span className="text-primary ml-1">MAIL</span>
              </h1>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 flex justify-center min-w-0 max-w-2xl mx-4">
          <SearchBar 
            filters={filters}
            onUpdateFilter={onUpdateFilter}
            onResetFilters={onResetFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* AI Assistant */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onAIClick} className="hover:text-primary hover:bg-primary/10">
                <Sparkles className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>AI Assistant</TooltipContent>
          </Tooltip>

          {/* Theme Toggle with System option */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:text-primary hover:bg-primary/10">
                    {theme === "system" ? (
                      <Monitor className="w-5 h-5" />
                    ) : theme === "dark" ? (
                      <Moon className="w-5 h-5" />
                    ) : (
                      <Sun className="w-5 h-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Theme</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
                {theme === "light" && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
                {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
                {theme === "system" && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:text-primary hover:bg-primary/10">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <h4 className="font-semibold text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7 px-2"
                    onClick={() => markAllAsRead()}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors group ${
                        !notification.is_read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                        >
                          <p className="text-sm font-medium">{notification.title}</p>
                          {notification.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Apps Grid */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:text-primary hover:bg-primary/10">
                    <Grid3X3 className="w-5 h-5" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Alsamos Apps</TooltipContent>
            </Tooltip>
            <PopoverContent className="w-64 p-3" align="end">
              <h4 className="font-semibold text-sm mb-3">Alsamos Apps</h4>
              <div className="grid grid-cols-3 gap-2">
                {appLinks.map((app) => (
                  <a
                    key={app.name}
                    href={app.href || "#"}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                      app.active ? "bg-primary/10 ring-1 ring-primary/20" : ""
                    }`}
                  >
                    <span className="text-2xl">{app.icon}</span>
                    <span className="text-xs font-medium">{app.name}</span>
                  </a>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Help */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onKeyboardShortcutsClick} className="hover:text-primary hover:bg-primary/10">
                <HelpCircle className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Help & Shortcuts</TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onSettingsClick} className="hover:text-primary hover:bg-primary/10">
                <Settings className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 ml-2 pl-4 border-l border-border hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-semibold text-primary-foreground">{userInitials}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3 p-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                    <span className="text-lg font-semibold text-primary-foreground">{userInitials}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{displayName}</span>
                    <span className="text-sm text-muted-foreground">{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSettingsClick} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile & Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onKeyboardShortcutsClick} className="cursor-pointer">
                <Keyboard className="mr-2 h-4 w-4" />
                <span>Keyboard Shortcuts</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                <span>Security</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </TooltipProvider>
  );
}
