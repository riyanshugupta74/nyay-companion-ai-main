import { useState, useEffect } from "react";
import { User, Mail, Lock, Save, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDashboard } from "@/contexts/DashboardContext";

interface UserProfileProps {
  children: React.ReactNode;
  userName: string;
  onNameUpdate: (newName: string) => void;
}

const UserProfile = ({ children, userName, onNameUpdate }: UserProfileProps) => {
  const { t } = useDashboard();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  // Form states
  const [fullName, setFullName] = useState(userName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newMobile, setNewMobile] = useState("");

  useEffect(() => {
    setFullName(userName);
  }, [userName]);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
        setNewEmail(user.email);
      }
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('mobile')
          .eq('id', user.id)
          .single();
        if (profile?.mobile) {
          setMobile(profile.mobile);
          setNewMobile(profile.mobile);
        }
      }
    };
    if (open) {
      fetchUserData();
    }
  }, [open]);

  const handleUpdateName = async () => {
    if (!fullName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      onNameUpdate(fullName.trim());
      toast.success("Name updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMobile = async () => {
    if (!newMobile.trim()) {
      toast.error("Phone number cannot be empty");
      return;
    }

    if (newMobile === mobile) {
      toast.info("Phone number is the same as current");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if mobile is already registered by another user
      const { data: checkResult } = await supabase.functions.invoke('check-duplicate-registration', {
        body: { mobile: newMobile.trim() }
      });

      if (checkResult?.duplicate && checkResult?.field === 'mobile') {
        toast.error("This phone number is already registered by another user");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ mobile: newMobile.trim() })
        .eq('id', user.id);

      if (error) throw error;

      setMobile(newMobile.trim());
      toast.success("Phone number updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update phone number");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("Email cannot be empty");
      return;
    }

    if (newEmail === email) {
      toast.info("Email is the same as current");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-user-email', {
        body: { newEmail: newEmail.trim() }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setEmail(newEmail.trim());
      toast.success("Email updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            My Profile
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="name" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="name" className="text-xs sm:text-sm">
              <User className="w-4 h-4 mr-1 hidden sm:inline" />
              Name
            </TabsTrigger>
            <TabsTrigger value="phone" className="text-xs sm:text-sm">
              <Phone className="w-4 h-4 mr-1 hidden sm:inline" />
              Phone
            </TabsTrigger>
            <TabsTrigger value="email" className="text-xs sm:text-sm">
              <Mail className="w-4 h-4 mr-1 hidden sm:inline" />
              Email
            </TabsTrigger>
            <TabsTrigger value="password" className="text-xs sm:text-sm">
              <Lock className="w-4 h-4 mr-1 hidden sm:inline" />
              Password
            </TabsTrigger>
          </TabsList>

          <TabsContent value="name" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <Button
              onClick={handleUpdateName}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Update Name
            </Button>
          </TabsContent>

          <TabsContent value="phone" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Current Phone</Label>
              <Input
                value={mobile || "Not set"}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newMobile">New Phone Number</Label>
              <Input
                id="newMobile"
                type="tel"
                value={newMobile}
                onChange={(e) => setNewMobile(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <Button
              onClick={handleUpdateMobile}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Update Phone
            </Button>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Current Email</Label>
              <Input
                value={email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
              />
            </div>
            <Button
              onClick={handleUpdateEmail}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Update Email
            </Button>
            <p className="text-xs text-muted-foreground">
              Email will be updated directly without verification.
            </p>
          </TabsContent>

          <TabsContent value="password" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button
              onClick={handleUpdatePassword}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Update Password
            </Button>
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters long.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;


// What this component is

// It is a profile settings popup (dialog) where a user can update:

// Name
// Phone number
// Email
// Password

// It opens as a modal (popup window) when the user clicks a button.
