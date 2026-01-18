import { useState, useMemo, useCallback } from "react";
import { Email } from "@/types/email";

export interface EmailFilters {
  query: string;
  from: string;
  to: string;
  dateFrom: string;
  dateTo: string;
  hasAttachment: "any" | "yes" | "no";
  labels: string[];
}

const initialFilters: EmailFilters = {
  query: "",
  from: "",
  to: "",
  dateFrom: "",
  dateTo: "",
  hasAttachment: "any",
  labels: [],
};

export function useEmailFilter(emails: Email[]) {
  const [filters, setFilters] = useState<EmailFilters>(initialFilters);

  const updateFilter = useCallback(<K extends keyof EmailFilters>(key: K, value: EmailFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      // Search query - matches subject, snippet, sender name, or sender email
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const matchesQuery =
          email.subject.toLowerCase().includes(query) ||
          email.snippet.toLowerCase().includes(query) ||
          email.from.name.toLowerCase().includes(query) ||
          email.from.email.toLowerCase().includes(query) ||
          email.body.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // From filter
      if (filters.from) {
        const from = filters.from.toLowerCase();
        const matchesFrom =
          email.from.name.toLowerCase().includes(from) ||
          email.from.email.toLowerCase().includes(from);
        if (!matchesFrom) return false;
      }

      // To filter
      if (filters.to) {
        const to = filters.to.toLowerCase();
        const matchesTo = email.to.some(
          (recipient) =>
            recipient.name.toLowerCase().includes(to) ||
            recipient.email.toLowerCase().includes(to)
        );
        if (!matchesTo) return false;
      }

      // Date from filter
      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom);
        if (email.timestamp < dateFrom) return false;
      }

      // Date to filter
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        if (email.timestamp > dateTo) return false;
      }

      // Has attachment filter
      if (filters.hasAttachment === "yes" && email.attachments.length === 0) return false;
      if (filters.hasAttachment === "no" && email.attachments.length > 0) return false;

      // Labels filter
      if (filters.labels.length > 0) {
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
