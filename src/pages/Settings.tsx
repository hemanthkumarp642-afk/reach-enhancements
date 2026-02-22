import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Bell } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [dailyReminderTime, setDailyReminderTime] = useState("08:00");
  const [timezone, setTimezone] = useState("UTC");
  const [browserNotifications, setBrowserNotifications] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setBrowserNotifications(Notification.permission === "granted");
    }
  }, []);

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { fullName: "" } });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });

  useEffect(() => { loadUserData(); }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      if (profile) profileForm.setValue("fullName", profile.full_name || "");
      const { data: settings } = await supabase.from("user_settings").select("*").eq("user_id", user.id).single();
      if (settings) {
        setEmailNotifications(settings.email_notifications ?? true);
        setNotificationEmail(settings.notification_email || user.email || "");
        setDailyReminderTime(settings.daily_reminder_time || "08:00");
        setTimezone(settings.timezone || "UTC");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      const { error } = await supabase.from("profiles").update({ full_name: values.fullName }).eq("id", user.id);
      if (error) throw error;
      toast({ title: "Profile updated", description: "Your profile has been updated successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.newPassword });
      if (error) throw error;
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      passwordForm.reset();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const saveNotificationSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      const { error } = await supabase.from("user_settings").update({
        email_notifications: emailNotifications, notification_email: notificationEmail,
        daily_reminder_time: dailyReminderTime, timezone: timezone,
      }).eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Settings saved", description: "Your notification settings have been updated." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  if (pageLoading) {
    return (
      <AuthGuard>
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-5 sm:space-y-6">
          <div><Skeleton className="h-8 w-32 mb-2" /><Skeleton className="h-4 w-48" /></div>
          {[1,2,3].map(i => (
            <Card key={i}><CardHeader><Skeleton className="h-5 w-40 mb-1" /><Skeleton className="h-3 w-56" /></CardHeader>
              <CardContent className="space-y-4">{[1,2].map(j => <Skeleton key={j} className="h-10 w-full" />)}</CardContent>
            </Card>
          ))}
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-3xl mx-auto space-y-5 sm:space-y-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Manage your account preferences</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Profile Information</CardTitle><CardDescription>Update your personal information</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" {...profileForm.register("fullName")} placeholder="Enter your full name" />
                {profileForm.formState.errors.fullName && <p className="text-sm text-destructive">{profileForm.formState.errors.fullName.message}</p>}
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Security</CardTitle><CardDescription>Change your password</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" {...passwordForm.register("currentPassword")} placeholder="Enter current password" />
                {passwordForm.formState.errors.currentPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} placeholder="Enter new password" />
                {passwordForm.formState.errors.newPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" {...passwordForm.register("confirmPassword")} placeholder="Confirm new password" />
                {passwordForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Change Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Notifications</CardTitle><CardDescription>Manage your notification preferences</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="browserNotifications" className="flex items-center gap-2"><Bell className="h-4 w-4" /> Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">Get browser alerts when follow-up reminders are due</p>
              </div>
              <Switch
                id="browserNotifications"
                checked={browserNotifications}
                onCheckedChange={async (checked) => {
                  if (checked && "Notification" in window) {
                    const permission = await Notification.requestPermission();
                    setBrowserNotifications(permission === "granted");
                    if (permission !== "granted") {
                      toast({ title: "Permission denied", description: "Please allow notifications in your browser settings.", variant: "destructive" });
                    }
                  } else {
                    setBrowserNotifications(false);
                    toast({ title: "Browser notifications disabled", description: "You can re-enable them anytime." });
                  }
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email notifications for important updates</p>
              </div>
              <Switch id="emailNotifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="notificationEmail">Notification Email</Label>
              <Input id="notificationEmail" type="email" value={notificationEmail} onChange={(e) => setNotificationEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyReminderTime">Daily Reminder Time</Label>
              <Input id="dailyReminderTime" type="time" value={dailyReminderTime} onChange={(e) => setDailyReminderTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone"><SelectValue placeholder="Select timezone" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveNotificationSettings} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Notification Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
};

export default Settings;
