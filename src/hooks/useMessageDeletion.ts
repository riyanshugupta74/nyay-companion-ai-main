import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  status: string;
  case_type?: string;
  isFile?: boolean;
  fileName?: string;
  hidden_for?: string[];
}

export const useMessageDeletion = (
  currentUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  isDemoMode: boolean = false
) => {
  // Delete for Me - Hide message from current user's view only
  const handleDeleteForMe = useCallback(
    async (messageId: string) => {
      if (!currentUserId) {
        toast.error("Please login to delete messages");
        return;
      }

      // Optimistic update - remove from UI immediately
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      if (isDemoMode) {
        toast.success("Message deleted for you");
        return;
      }

      try {
        // Get current hidden_for array and add current user
        const { data: message, error: fetchError } = await supabase
          .from("messages")
          .select("hidden_for")
          .eq("id", messageId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        const currentHiddenFor = (message?.hidden_for as string[]) || [];
        
        if (!currentHiddenFor.includes(currentUserId)) {
          const { error: updateError } = await supabase
            .from("messages")
            .update({
              hidden_for: [...currentHiddenFor, currentUserId],
            })
            .eq("id", messageId);

          if (updateError) throw updateError;
        }

        toast.success("Message deleted for you");
      } catch (error) {
        console.error("Error hiding message:", error);
        toast.error("Failed to delete message");
        // Revert optimistic update would require refetching
      }
    },
    [currentUserId, setMessages, isDemoMode]
  );

  // Delete for Everyone - Permanently delete from database
  const handleDeleteForEveryone = useCallback(
    async (messageId: string) => {
      if (!currentUserId) {
        toast.error("Please login to delete messages");
        return;
      }

      // Optimistic update - remove from UI immediately with animation
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

      if (isDemoMode) {
        toast.success("Message deleted for everyone");
        return;
      }

      try {
        const { error } = await supabase
          .from("messages")
          .delete()
          .eq("id", messageId)
          .eq("sender_id", currentUserId); // Ensure only sender can delete

        if (error) throw error;

        toast.success("Message deleted for everyone");
      } catch (error) {
        console.error("Error deleting message:", error);
        toast.error("Failed to delete message");
      }
    },
    [currentUserId, setMessages, isDemoMode]
  );

  // Filter messages that should be visible to current user
  const filterVisibleMessages = useCallback(
    (messages: Message[]) => {
      if (!currentUserId) return messages;
      return messages.filter(
        (msg) => !msg.hidden_for?.includes(currentUserId)
      );
    },
    [currentUserId]
  );

  return {
    handleDeleteForMe,
    handleDeleteForEveryone,
    filterVisibleMessages,
  };
};
