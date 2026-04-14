import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ProfileData {
  displayName: string;
  birthday: string;
  avatarUrl: string;
}

const AVATAR_KEY_PREFIX = "booktracker-avatar-";

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    displayName: "",
    birthday: "",
    avatarUrl: "",
  });
  const [saving, setSaving] = useState(false);

  // Load profile from user metadata + localStorage avatar
  useEffect(() => {
    if (!user) return;

    const meta = user.user_metadata || {};
    const savedAvatar = localStorage.getItem(AVATAR_KEY_PREFIX + user.id) || "";

    setProfile({
      displayName: meta.display_name || "",
      birthday: meta.birthday || "",
      avatarUrl: savedAvatar,
    });
  }, [user]);

  const saveProfile = useCallback(async (data: Partial<ProfileData>) => {
    if (!user) return;
    setSaving(true);

    try {
      // Save name and birthday to Supabase user metadata
      if (data.displayName !== undefined || data.birthday !== undefined) {
        const updateData: Record<string, string> = {};
        if (data.displayName !== undefined) updateData.display_name = data.displayName;
        if (data.birthday !== undefined) updateData.birthday = data.birthday;

        await supabase.auth.updateUser({ data: updateData });
      }

      // Save avatar to localStorage (base64)
      if (data.avatarUrl !== undefined) {
        if (data.avatarUrl) {
          localStorage.setItem(AVATAR_KEY_PREFIX + user.id, data.avatarUrl);
        } else {
          localStorage.removeItem(AVATAR_KEY_PREFIX + user.id);
        }
      }

      setProfile((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setSaving(false);
    }
  }, [user]);

  return { profile, saveProfile, saving };
}
