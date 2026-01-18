import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  X,
  User,
  Calendar,
  Paperclip,
  Tag,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmailFilters } from "@/hooks/useEmailFilter";

interface SearchBarProps {
  filters: EmailFilters;
  onUpdateFilter: <K extends keyof EmailFilters>(key: K, value: EmailFilters[K]) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const suggestions = [
  "Find emails about invoices",
  "Show unread from last week",
  "Emails with attachments",
  "Messages from team",
];

export function SearchBar({ filters, onUpdateFilter, onResetFilters, hasActiveFilters }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleSuggestionClick = (suggestion: string) => {
    onUpdateFilter("query", suggestion);
    setIsFocused(false);
  };

  const handleApplyFilters = () => {
    setShowFilters(false);
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div
        className={cn(
          "flex items-center gap-3 px-4 h-12 rounded-xl border transition-all duration-200",
          isFocused
            ? "border-primary/50 bg-card shadow-glow"
            : "border-border bg-secondary/50"
        )}
      >
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <Input
          value={filters.query}
          onChange={(e) => onUpdateFilter("query", e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search emails or ask AI..."
          className="border-0 bg-transparent p-0 h-full focus-visible:ring-0 text-sm"
        />
        <div className="flex items-center gap-2">
          {(filters.query || hasActiveFilters) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onResetFilters}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", (showFilters || hasActiveFilters) && "text-primary")}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
          <div className="ai-chip">
            <Sparkles className="w-3 h-3" />
            AI
          </div>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isFocused && !filters.query && !showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-card border border-border rounded-xl shadow-elevated z-50"
          >
            <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
              Try AI-powered search
            </p>
            <div className="space-y-1">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-secondary transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 bg-card border border-border rounded-xl shadow-elevated z-50"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <User className="w-3 h-3" />
                  From
                </label>
                <Input
                  placeholder="Sender email or name"
                  value={filters.from}
                  onChange={(e) => onUpdateFilter("from", e.target.value)}
                  className="h-9 text-sm bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <User className="w-3 h-3" />
                  To
                </label>
                <Input
                  placeholder="Recipient email or name"
                  value={filters.to}
                  onChange={(e) => onUpdateFilter("to", e.target.value)}
                  className="h-9 text-sm bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Calendar className="w-3 h-3" />
                  Date from
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onUpdateFilter("dateFrom", e.target.value)}
                  className="h-9 text-sm bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Calendar className="w-3 h-3" />
                  Date to
                </label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onUpdateFilter("dateTo", e.target.value)}
                  className="h-9 text-sm bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Paperclip className="w-3 h-3" />
                  Has attachment
                </label>
                <select 
                  value={filters.hasAttachment}
                  onChange={(e) => onUpdateFilter("hasAttachment", e.target.value as "any" | "yes" | "no")}
                  className="w-full h-9 px-3 text-sm bg-secondary border border-border rounded-md"
                >
                  <option value="any">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <Tag className="w-3 h-3" />
                  Labels
                </label>
                <Input
                  placeholder="Filter by labels..."
                  value={filters.labels.join(", ")}
                  onChange={(e) => onUpdateFilter("labels", e.target.value.split(",").map(l => l.trim()).filter(Boolean))}
                  className="h-9 text-sm bg-secondary border-border"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onResetFilters();
                  setShowFilters(false);
                }}
              >
                Clear all
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={handleApplyFilters}>
                Apply filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
