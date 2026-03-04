import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PracticeSidebar } from "@/components/practice/PracticeSidebar";
import {
  Building2,
  Bell,
  CreditCard,
  Users,
  Shield,
  Upload,
  MapPin,
  Phone,
  Mail,
  Globe,
  Save,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TeamTab } from "@/components/practice/settings/TeamTab";
import { BillingTab } from "@/components/practice/settings/BillingTab";
import { SecurityTab } from "@/components/practice/settings/SecurityTab";
import { PracticeHeader } from "@/components/practice/PracticeHeader";

import {
  Practice,
  TeamMember,
  Invoice,
} from "@/components/practice/settings/types";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

interface EmailPreference {
  id: string;
  title: string;
  description: string;
  checked: boolean;
}

const tabs = [
  { id: "practice", label: "Practice Info", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "team", label: "Team", icon: Users },
  { id: "security", label: "Security", icon: Shield },
];

const initialHours = [
  {
    day: "Monday",
    openHour: "09",
    openMin: "00",
    openPeriod: "AM",
    closeHour: "05",
    closeMin: "00",
    closePeriod: "PM",
    closed: false,
  },
  {
    day: "Tuesday",
    openHour: "09",
    openMin: "00",
    openPeriod: "AM",
    closeHour: "05",
    closeMin: "00",
    closePeriod: "PM",
    closed: false,
  },
  {
    day: "Wednesday",
    openHour: "09",
    openMin: "00",
    openPeriod: "AM",
    closeHour: "05",
    closeMin: "00",
    closePeriod: "PM",
    closed: false,
  },
  {
    day: "Thursday",
    openHour: "09",
    openMin: "00",
    openPeriod: "AM",
    closeHour: "05",
    closeMin: "00",
    closePeriod: "PM",
    closed: false,
  },
  {
    day: "Friday",
    openHour: "09",
    openMin: "00",
    openPeriod: "AM",
    closeHour: "05",
    closeMin: "00",
    closePeriod: "PM",
    closed: false,
  },
  {
    day: "Saturday",
    openHour: "09",
    openMin: "00",
    openPeriod: "AM",
    closeHour: "01",
    closeMin: "00",
    closePeriod: "PM",
    closed: false,
  },
  {
    day: "Sunday",
    openHour: "--",
    openMin: "--",
    openPeriod: "--",
    closeHour: "--",
    closeMin: "--",
    closePeriod: "--",
    closed: true,
  },
];

const hours = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];
const minutes = ["00", "15", "30", "45"];
const periods = ["AM", "PM"];

export default function PracticeSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("practice");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [operatingHours, setOperatingHours] = useState(initialHours);
  const [practiceName, setPracticeName] = useState("");
  const [practiceType, setPracticeType] = useState("general");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: "email",
      title: "Email Notifications",
      description: "Receive email updates about bookings and messages",
      enabled: true,
    },
    {
      id: "sms",
      title: "SMS Notifications",
      description: "Get text message reminders for upcoming shifts",
      enabled: true,
    },
    {
      id: "push",
      title: "Push Notifications",
      description: "Receive browser notifications for urgent updates",
      enabled: false,
    },
  ]);

  const [emailPreferences, setEmailPreferences] = useState<EmailPreference[]>([
    {
      id: "locum-applications",
      title: "New Locum Applications",
      description: "When a locum applies for a posted shift",
      checked: true,
    },
    {
      id: "shift-confirmations",
      title: "Shift Confirmations",
      description: "When a booking is confirmed or cancelled",
      checked: true,
    },
    {
      id: "payment-reminders",
      title: "Payment Reminders",
      description: "Reminders for pending payments",
      checked: true,
    },
    {
      id: "weekly-summary",
      title: "Weekly Summary",
      description: "Weekly overview of bookings and activity",
      checked: false,
    },
    {
      id: "marketing",
      title: "Marketing & Updates",
      description: "News, tips, and platform updates",
      checked: false,
    },
  ]);

  const [billingPractice, setBillingPractice] = useState<Practice | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!profile) return;

      // Fetch Practice
      let practiceId = "";
      const { data: practice } = await supabase
        .from('practices')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (practice) {
        practiceId = practice.id;
        const p = practice as any;
        setBillingPractice(p);
        setPracticeName(profile.practice_name || p.billing_name || "");
        setPracticeType(p.practice_type || "general");
        setDescription(p.description || "");
        setAddress(profile.address_line1 || p.billing_address_line1 || "");
        setPhone(profile.phone || p.phone || "");
        setEmail(profile.email || p.email || "");
        setWebsite(p.website || "");
        if (p.operating_hours) {
          try {
            const hours = typeof p.operating_hours === 'string' ? JSON.parse(p.operating_hours) : p.operating_hours;
            setOperatingHours(hours);
          } catch(e) {
            console.error(e);
          }
        }
      }

      if (practiceId) {
        // Fetch Members
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('*')
          .eq('practice_id', practiceId);
        
        if (teamMembers) setMembers(teamMembers as any);

        // Fetch Invoices
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select(`
            id:invoice_number,
            invoice_date:generated_at,
            amount:amount_total,
            status:status
          `)
          .eq('booking.practice_id', practiceId); // Note: Simplified relation join
        
        if (invoicesData) {
          setInvoices(invoicesData.map((inv: any) => ({
             ...inv,
             invoice_date: new Date(inv.invoice_date).toISOString().split('T')[0],
             currency: 'GBP',
             status: inv.status || 'Paid'
          })) as any);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    navigate("/login");
  };

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n)),
    );
  };

  const toggleEmailPreference = (id: string) => {
    setEmailPreferences((prev) =>
      prev.map((p) => (p.id === id ? { ...p, checked: !p.checked } : p)),
    );
  };

  const updateHours = (
    dayIndex: number,
    field:
      | "openHour"
      | "openMin"
      | "openPeriod"
      | "closeHour"
      | "closeMin"
      | "closePeriod"
      | "closed",
    value: string | boolean,
  ) => {
    setOperatingHours((prev) =>
      prev.map((item, idx) => {
        if (idx === dayIndex) {
          if (field === "closed") {
            return {
              ...item,
              closed: value as boolean,
              openHour: value ? "--" : "09",
              openMin: value ? "--" : "00",
              openPeriod: value ? "--" : "AM",
              closeHour: value ? "--" : "05",
              closeMin: value ? "--" : "00",
              closePeriod: value ? "--" : "PM",
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      }),
    );
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update practice information
      const practiceUpdateData: any = {
        practice_type: practiceType,
        description: description,
        website: website,
        phone: phone,
        email: email,
        operating_hours: operatingHours
      };

      await supabase
        .from('practices')
        .update(practiceUpdateData)
        .eq('user_id', user.id);

      // Update basic profile fields
      const profileUpdateData: any = {
        practice_name: practiceName,
        address_line1: address,
        phone: phone,
        email: email
      };

      await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('user_id', user.id);

      toast({
        title: "Settings saved",
        description: "Your practice settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving practice settings:", error);
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <PracticeSidebar onLogout={handleLogout} />

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <PracticeSidebar onLogout={handleLogout} isMobileSheet={true} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 w-full min-w-0 md:ml-64 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <PracticeHeader
          title="Practice Settings"
          subtitle="Manage your practice information and preferences"
          onMenuToggle={() => setMobileMenuOpen(true)}
        />


        {/* Tabs */}
        <div className="sticky top-[65px] z-20 border-b border-border bg-card px-4 md:px-8 flex-shrink-0">
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-4 md:px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 md:p-8 pb-32 md:pb-24 overflow-y-auto">
          <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
            {activeTab === "practice" && (
              <>
                {/* Practice Details Card */}
                <div className="rounded-lg border border-border bg-card p-4 md:p-6 overflow-hidden">
                  <h2 className="text-lg font-medium text-foreground">
                    Practice Details
                  </h2>

                  {/* Logo Upload */}
                  <div className="mt-4 md:mt-6 flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
                    <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-2xl font-bold">
                      SC
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        className="gap-2 bg-transparent w-full sm:w-auto"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Logo
                      </Button>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Recommended: Square image, at least 400x400px
                      </p>
                    </div>
                  </div>

                  {/* Practice Name & Type */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="practice-name">Practice Name</Label>
                      <Input
                        id="practice-name"
                        value={practiceName}
                        onChange={(e) => setPracticeName(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="practice-type">Practice Type</Label>
                      <Select
                        value={practiceType}
                        onValueChange={setPracticeType}
                      >
                        <SelectTrigger className="bg-background w-full">
                          <SelectValue placeholder="Select practice type" />
                        </SelectTrigger>
                        <SelectContent title="Practice Type">
                          <SelectItem value="general">
                            General Practice
                          </SelectItem>
                          <SelectItem value="specialist">
                            Specialist Practice
                          </SelectItem>
                          <SelectItem value="hospital">Hospital</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Practice Description */}
                  <div className="mt-6 space-y-2">
                    <Label htmlFor="description">Practice Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[100px] bg-background w-full resize-none sm:resize-y"
                    />
                  </div>
                </div>

                {/* Contact Information Card */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="text-lg font-medium text-foreground">
                    Contact Information
                  </h2>

                  {/* Address */}
                  <div className="mt-6 space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-background pl-10"
                      />
                    </div>
                  </div>

                  {/* Phone & Email */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-background pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-background pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Website */}
                  <div className="mt-6 space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="bg-background pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Operating Hours Card */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="text-lg font-medium text-foreground">
                    Operating Hours
                  </h2>

                  <div className="mt-6 space-y-4">
                    {operatingHours.map((schedule, index) => (
                      <div
                        key={schedule.day}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-0 rounded-lg sm:rounded-none bg-muted/30 sm:bg-transparent border border-border sm:border-none"
                      >
                        <span className="w-full sm:w-24 text-sm font-medium sm:font-normal text-foreground">
                          {schedule.day}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                          {schedule.closed ? (
                            <>
                              <div className="flex items-center gap-1 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                                <span className="w-5 text-center">--</span>
                                <span>:</span>
                                <span className="w-5 text-center">--</span>
                                <span className="ml-2">--</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                to
                              </span>
                              <div className="flex items-center gap-1 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                                <span className="w-5 text-center">--</span>
                                <span>:</span>
                                <span className="w-5 text-center">--</span>
                                <span className="ml-2">--</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1 rounded-md border border-input bg-muted/50 text-sm">
                                <select
                                  value={schedule.openHour}
                                  onChange={(e) =>
                                    updateHours(index, "openHour", e.target.value)
                                  }
                                  className="w-10 sm:w-12 appearance-none bg-transparent py-2 pl-2 sm:pl-3 pr-1 text-center focus:outline-none"
                                >
                                  {hours.map((h) => (
                                    <option key={h} value={h}>
                                      {h}
                                    </option>
                                  ))}
                                </select>
                                <span>:</span>
                                <select
                                  value={schedule.openMin}
                                  onChange={(e) =>
                                    updateHours(index, "openMin", e.target.value)
                                  }
                                  className="w-10 sm:w-12 appearance-none bg-transparent py-2 pr-1 text-center focus:outline-none"
                                >
                                  {minutes.map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={schedule.openPeriod}
                                  onChange={(e) =>
                                    updateHours(
                                      index,
                                      "openPeriod",
                                      e.target.value,
                                    )
                                  }
                                  className="w-10 sm:w-12 appearance-none bg-transparent py-2 pr-2 text-center text-muted-foreground focus:outline-none"
                                >
                                  {periods.map((p) => (
                                    <option key={p} value={p}>
                                      {p}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                to
                              </span>
                              <div className="flex items-center gap-1 rounded-md border border-input bg-muted/50 text-sm">
                                <select
                                  value={schedule.closeHour}
                                  onChange={(e) =>
                                    updateHours(
                                      index,
                                      "closeHour",
                                      e.target.value,
                                    )
                                  }
                                  className="w-10 sm:w-12 appearance-none bg-transparent py-2 pl-2 sm:pl-3 pr-1 text-center focus:outline-none"
                                >
                                  {hours.map((h) => (
                                    <option key={h} value={h}>
                                      {h}
                                    </option>
                                  ))}
                                </select>
                                <span>:</span>
                                <select
                                  value={schedule.closeMin}
                                  onChange={(e) =>
                                    updateHours(index, "closeMin", e.target.value)
                                  }
                                  className="w-10 sm:w-12 appearance-none bg-transparent py-2 pr-1 text-center focus:outline-none"
                                >
                                  {minutes.map((m) => (
                                    <option key={m} value={m}>
                                      {m}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={schedule.closePeriod}
                                  onChange={(e) =>
                                    updateHours(
                                      index,
                                      "closePeriod",
                                      e.target.value,
                                    )
                                  }
                                  className="w-10 sm:w-12 appearance-none bg-transparent py-2 pr-2 text-center text-muted-foreground focus:outline-none"
                                >
                                  {periods.map((p) => (
                                    <option key={p} value={p}>
                                      {p}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              updateHours(index, "closed", !schedule.closed)
                            }
                            className={cn(
                              "rounded-md px-3 py-1 text-sm transition-colors sm:ml-auto",
                              schedule.closed
                                ? "bg-primary/10 text-primary hover:bg-primary/20 font-medium"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {schedule.closed ? "Open" : "Mark Closed"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="text-lg font-medium text-foreground mb-6">
                    Notification Preferences
                  </h2>
                  <div className="space-y-6">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <Label
                            htmlFor={notification.id}
                            className="text-sm font-medium text-foreground"
                          >
                            {notification.title}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {notification.description}
                          </p>
                        </div>
                        <Switch
                          id={notification.id}
                          checked={notification.enabled}
                          onCheckedChange={() =>
                            toggleNotification(notification.id)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                  <h2 className="text-lg font-medium text-foreground mb-6">
                    Email Preferences
                  </h2>
                  <div className="space-y-5">
                    {emailPreferences.map((preference) => (
                      <div
                        key={preference.id}
                        className="flex items-start gap-3"
                      >
                        <Checkbox
                          id={preference.id}
                          checked={preference.checked}
                          onCheckedChange={() =>
                            toggleEmailPreference(preference.id)
                          }
                          className="mt-0.5"
                        />
                        <div className="space-y-0.5">
                          <Label
                            htmlFor={preference.id}
                            className="text-sm font-medium text-foreground cursor-pointer"
                          >
                            {preference.title}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {preference.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <BillingTab practice={billingPractice} invoices={invoices} />
            )}

            {activeTab === "team" && (
              <TeamTab
                members={members}
                practiceId={billingPractice?.id || ""}
                onMemberUpdated={fetchData}
              />
            )}

            {activeTab === "security" && <SecurityTab />}
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 bg-background/80 backdrop-blur-sm border-t border-border md:bg-transparent md:backdrop-blur-none md:border-none md:static md:p-0 md:flex md:justify-end md:max-w-4xl md:mx-auto md:mb-12">
          <Button onClick={handleSave} className="w-full md:w-auto gap-2 shadow-lg md:fixed md:bottom-6 md:right-6">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
