import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function SettingsSection() {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Update password with Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your password has been updated successfully",
      });

      // Reset form and close dialog
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">
          Manage your account preferences and security
        </p>
      </div>

      {/* Account Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 text-foreground">
          Account Information
        </h3>
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 font-normal text-foreground bg-white hover:bg-slate-50 border-input"
            disabled
          >
            Change Email Address
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 font-normal text-foreground bg-white hover:bg-slate-50 border-input"
            disabled
          >
            Update Phone Number
          </Button>

          {/* Password Change Dialog */}
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3 px-4 font-normal text-foreground bg-white hover:bg-slate-50 border-input"
              >
                Change Password
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleChangePassword}>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your new password below. Password must be at least 6
                    characters long.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPasswordDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 text-foreground">Security</h3>
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 font-normal text-foreground bg-white hover:bg-slate-50 border-input"
            disabled
          >
            Enable Two-Factor Authentication
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 font-normal text-foreground bg-white hover:bg-slate-50 border-input"
            disabled
          >
            View Login History
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4 font-normal text-foreground bg-white hover:bg-slate-50 border-input"
            disabled
          >
            Manage Connected Devices
          </Button>
        </div>
      </Card>

      {/* Privacy */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 text-foreground">Privacy</h3>
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-normal text-foreground">
              Profile Visibility
            </Label>
            <RadioGroup defaultValue="public" className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="font-normal cursor-pointer">
                  Public - Visible to all practices
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="invite" id="invite" />
                <Label htmlFor="invite" className="font-normal cursor-pointer">
                  Invite Only - Only practices you've worked with
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hidden" id="hidden" />
                <Label htmlFor="hidden" className="font-normal cursor-pointer">
                  Hidden - Not searchable
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200 bg-red-50/10">
        <h3 className="text-lg font-semibold mb-6 text-foreground/80">
          Danger Zone
        </h3>

        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>

          <Button
            variant="destructive"
            className="w-full bg-[#cc4433] hover:bg-[#b33b2d] text-white"
            disabled
          >
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
