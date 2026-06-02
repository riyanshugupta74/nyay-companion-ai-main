import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, UserX, Users } from "lucide-react";

interface MessageDeleteMenuProps {
  children: React.ReactNode;
  messageId: string;
  senderId: string;
  currentUserId: string;
  onDeleteForMe: (messageId: string) => void;
  onDeleteForEveryone: (messageId: string) => void;
  disabled?: boolean;
}

const MessageDeleteMenu = ({
  children,
  messageId,
  senderId,
  currentUserId,
  onDeleteForMe,
  onDeleteForEveryone,
  disabled = false,
}: MessageDeleteMenuProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<"me" | "everyone" | null>(null);

  const isOwnMessage = senderId === currentUserId;

  const handleDeleteClick = (type: "me" | "everyone") => {
    setDeleteType(type);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deleteType === "me") {
      onDeleteForMe(messageId);
    } else if (deleteType === "everyone") {
      onDeleteForEveryone(messageId);
    }
    setShowDeleteDialog(false);
    setDeleteType(null);
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="cursor-pointer select-none transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]">
            {children}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuItem
            onClick={() => handleDeleteClick("me")}
            className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
          >
            <UserX className="w-4 h-4" />
            <span>Delete for Me</span>
          </ContextMenuItem>
          {isOwnMessage && (
            <ContextMenuItem
              onClick={() => handleDeleteClick("everyone")}
              className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Delete for Everyone</span>
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              {deleteType === "me" ? "Delete for Me?" : "Delete for Everyone?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === "me" ? (
                <>
                  This message will be removed from your chat only. 
                  <span className="block mt-1 text-muted-foreground">
                    The other person will still be able to see it.
                  </span>
                </>
              ) : (
                <>
                  This message will be permanently deleted for everyone.
                  <span className="block mt-1 font-medium text-destructive">
                    This action cannot be undone.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MessageDeleteMenu;




/* This component is a reusable wrapper for chat messages that adds:

✅ Right-click menu
✅ Delete for me
✅ Delete for everyone
✅ Permission checking
✅ Confirmation popup
✅ Smooth animations
✅ Modern UI using ShadCN + Tailwind */ 

// Message
//    ↓
// Right Click
//    ↓
// Menu Opens
//    ↓
// Choose Delete
//    ↓
// Popup Opens
//    ↓
// Confirm Delete