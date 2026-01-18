import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Signature {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export interface FilterRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  desktopNotifications: boolean;
  soundAlerts: boolean;
  dailyDigest: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  preferences: {
    theme: "dark" | "light" | "system";
    compactMode: boolean;
    aiEnabled: boolean;
  };
  signatures: Signature[];
  email_filters: FilterRule[];
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        const profileData: Profile = {
          id: data.id,
          user_id: data.user_id,
          display_name: data.display_name,
          avatar_url: data.avatar_url,
          preferences: (data.preferences as unknown as Profile["preferences"]) ?? { theme: "dark", compactMode: false, aiEnabled: true },
          signatures: (data.signatures as unknown as Signature[]) ?? [],
          email_filters: (data.email_filters as unknown as FilterRule[]) ?? [],
          notification_preferences: (data.notification_preferences as unknown as NotificationPreferences) ?? { emailNotifications: true, desktopNotifications: false, soundAlerts: true, dailyDigest: false },
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setProfile(profileData);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Omit<Profile, "id" | "user_id" | "created_at" | "updated_at">>) => {
    if (!user) return { error: new Error("Not authenticated") };

    try {
      // Cast to unknown first to satisfy TypeScript when passing to Supabase
      const { error } = await supabase
        .from("profiles")
        .update(updates as unknown as Record<string, unknown>)
        .eq("user_id", user.id);

      if (error) {
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      await fetchProfile();
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });

      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  }, [user, fetchProfile, toast]);

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile,
  };
}
