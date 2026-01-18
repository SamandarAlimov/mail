import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Label {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export function useLabels() {
  const { user } = useAuth();
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLabels = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await (supabase
      .from("labels" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true }) as any);

    if (error) {
      console.error("Error fetching labels:", error);
      toast.error("Failed to load labels");
    } else {
      setLabels((data as Label[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("labels-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "labels",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLabels((prev) => [...prev, payload.new as Label].sort((a, b) => a.name.localeCompare(b.name)));
          } else if (payload.eventType === "UPDATE") {
            setLabels((prev) =>
              prev.map((l) => (l.id === (payload.new as Label).id ? (payload.new as Label) : l))
            );
          } else if (payload.eventType === "DELETE") {
            setLabels((prev) => prev.filter((l) => l.id !== (payload.old as Label).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createLabel = useCallback(
    async (name: string, color: string) => {
      if (!user) return { error: new Error("Not authenticated") };

      const { data, error } = await (supabase
        .from("labels" as any)
        .insert({
          user_id: user.id,
          name: name.trim(),
          color,
        })
        .select()
        .single() as any);

      if (error) {
        console.error("Error creating label:", error);
        toast.error("Failed to create label");
        return { error };
      }

      toast.success("Label created");
      return { data: data as Label };
    },
    [user]
  );

  const updateLabel = useCallback(
    async (labelId: string, updates: Partial<Pick<Label, "name" | "color">>) => {
      if (!user) return { error: new Error("Not authenticated") };

      const { data, error } = await (supabase
        .from("labels" as any)
        .update(updates)
        .eq("id", labelId)
        .eq("user_id", user.id)
        .select()
        .single() as any);

      if (error) {
        console.error("Error updating label:", error);
        toast.error("Failed to update label");
        return { error };
      }

      toast.success("Label updated");
      return { data: data as Label };
    },
    [user]
  );

  const deleteLabel = useCallback(
    async (labelId: string) => {
      if (!user) return { error: new Error("Not authenticated") };

      const { error } = await supabase
        .from("labels" as any)
        .delete()
        .eq("id", labelId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting label:", error);
        toast.error("Failed to delete label");
        return { error };
      }

      toast.success("Label deleted");
      return { error: null };
    },
    [user]
  );

  return {
    labels,
    loading,
    createLabel,
    updateLabel,
    deleteLabel,
    refetch: fetchLabels,
  };
}
