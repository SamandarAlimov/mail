import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useContacts, Contact } from "@/hooks/useContacts";
import { cn } from "@/lib/utils";

interface ContactAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label: string;
}

export function ContactAutocomplete({
  value,
  onChange,
  placeholder,
  className,
  label,
}: ContactAutocompleteProps) {
  const { searchContacts } = useContacts();
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Contact[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get the current input portion (after the last comma)
  const getCurrentInput = useCallback(() => {
    const parts = value.split(",");
    return parts[parts.length - 1].trim();
  }, [value]);

  // Update suggestions when input changes
  useEffect(() => {
    const currentInput = getCurrentInput();
    if (isFocused && currentInput.length > 0) {
      const results = searchContacts(currentInput);
      setSuggestions(results);
      setSelectedIndex(0);
    } else if (isFocused && currentInput.length === 0) {
      // Show recent contacts when empty
      setSuggestions(searchContacts(""));
    } else {
      setSuggestions([]);
    }
  }, [value, isFocused, searchContacts, getCurrentInput]);

  // Handle selection
  const handleSelect = useCallback(
    (contact: Contact) => {
      const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
      parts.pop(); // Remove current incomplete input
      parts.push(contact.email);
      onChange(parts.join(", ") + (parts.length > 0 ? ", " : ""));
      setSuggestions([]);
      inputRef.current?.focus();
    },
    [value, onChange]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case "Enter":
        case "Tab":
          if (suggestions[selectedIndex]) {
            e.preventDefault();
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case "Escape":
          setSuggestions([]);
          break;
      }
    },
    [suggestions, selectedIndex, handleSelect]
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground w-10 sm:w-12 shrink-0">
          {label}
        </span>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "border-0 bg-transparent p-0 h-8 focus-visible:ring-0 text-sm",
            className
          )}
        />
      </div>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-10 sm:left-12 right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-elevated overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto py-1">
              {suggestions.map((contact, idx) => (
                <motion.button
                  key={contact.email}
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => handleSelect(contact)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                    idx === selectedIndex
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary"
                  )}
                >
                  <Avatar className="h-8 w-8">
                    {contact.avatar ? (
                      <AvatarImage src={contact.avatar} />
                    ) : null}
                    <AvatarFallback className="text-xs bg-secondary">
                      {contact.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {contact.email}
                    </p>
                  </div>
                  {contact.frequency > 1 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {contact.frequency}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
