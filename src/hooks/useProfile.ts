import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ProfileData {
  displayName: string;
  birthday: string;
  avatarUrl: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    displayName: "",
    birthday: "",
    avatarUrl: "",
  });
  const [saving, setSaving] = useState(false);

  // Load profile from user metadata + Supabase Storage avatar
  useEffect(() => {
    if (!user) return;

    const meta = user.user_metadata || {};

    // Build avatar URL from Supabase Storage
    let avatarUrl = "";
    if (meta.avatar_path) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(meta.avatar_path);
      avatarUrl = data?.publicUrl ? data.publicUrl + "?t=" + (meta.avatar_updated || "0") : "";
    }

    setProfile({
      displayName: meta.display_name || "",
      birthday: meta.birthday || "",
      avatarUrl,
    });
  }, [user]);

  const uploadAvatar = useCallback(async (base64Data: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Convert base64 to blob
      const res = await fetch(base64Data);
      const blob = await res.blob();

      const filePath = `${user.id}/avatar.jpg`;

      // Upload to Supabase Storage (upsert to overwrite)
      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/jpeg",
        });

      if (error) {
        console.error("Error uploading avatar:", error);
        return null;
      }

      return filePath;
    } catch (err) {
      console.error("Error uploading avatar:", err);
      return null;
    }
  }, [user]);

  const deleteAvatar = useCallback(async () => {
    if (!user) return;
    const filePath = `${user.id}/avatar.jpg`;
    await supabase.storage.from("avatars").remove([filePath]);
  }, [user]);

  const saveProfile = useCallback(async (data: Partial<ProfileData>) => {
    if (!user) return;
    setSaving(true);

    try {
      const updateData: Record<string, string> = {};

      if (data.displayName !== undefined) updateData.display_name = data.displayName;
      if (data.birthday !== undefined) updateData.birthday = data.birthday;

      // Handle avatar upload/delete
      if (data.avatarUrl !== undefined) {
        if (data.avatarUrl) {
          // Upload new avatar
          const path = await uploadAvatar(data.avatarUrl);
          if (path) {
            updateData.avatar_path = path;
            updateData.avatar_updated = String(Date.now());
          }
        } else {
          // Remove avatar
          await deleteAvatar();
          updateData.avatar_path = "";
          updateData.avatar_updated = "";
        }
      }

      // Save metadata to Supabase Auth
      await supabase.auth.updateUser({ data: updateData });

      // Update local state
      let newAvatarUrl = profile.avatarUrl;
      if (data.avatarUrl !== undefined) {
        if (data.avatarUrl && updateData.avatar_path) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(updateData.avatar_path);
          newAvatarUrl = urlData?.publicUrl ? urlData.publicUrl + "?t=" + updateData.avatar_updated : "";
        } else {
          newAvatarUrl = "";
        }
      }

      setProfile((prev) => ({
        ...prev,
        displayName: data.displayName !== undefined ? data.displayName : prev.displayName,
        birthday: data.birthday !== undefined ? data.birthday : prev.birthday,
        avatarUrl: newAvatarUrl,
      }));

      // Clean up old localStorage avatar if it exists
      localStorage.removeItem("booktracker-avatar-" + user.id);

    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setSaving(false);
    }
  }, [user, uploadAvatar, deleteAvatar, profile.avatarUrl]);

  return { profile, saveProfile, saving };
}
