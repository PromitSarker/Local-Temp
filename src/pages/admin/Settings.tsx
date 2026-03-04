import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SystemSetting {
    key: string;
    value: string;
    description: string;
    is_secret: boolean;
    [key: string]: any; // Allow other Supabase columns like created_at, id, etc.
}

export default function AdminSettings() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();


            if (user) {
                const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single();

            }

            const { data, error } = await supabase
                .from('system_settings')
                .select('*')
                .order('key');
            

            
            if (error) throw error;
            setSettings(data || []);
        } catch (error: any) {
            console.error('Error fetching settings:', error);
            toast({
                title: "Error",
                description: "Failed to load system settings. Ensure you are an admin.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Upsert all settings
            // Note: In a real app we might only update changed ones.
            const updates = settings.map(s => ({
                key: s.key,
                value: s.value
            }));

            // Since RLS policies might require specific privileges per row, 
            // we will loop for better error handling visibility per key or use upsert.
            for (const setting of settings) {
                const { error } = await supabase
                    .from('system_settings')
                    .update({ value: setting.value })
                    .eq('key', setting.key);
                
                if (error) throw error;
            }

            toast({
                title: "Settings Saved",
                description: "System configuration updated successfully."
            });
        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast({
                title: "Save Failed",
                description: error.message || "Could not update settings.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, newValue: string) => {
        setSettings(prev => prev.map(s => 
            s.key === key ? { ...s, value: newValue } : s
        ));
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    <p className="text-muted-foreground">Manage global application configuration and secrets.</p>
                </div>

                <form onSubmit={handleSave}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Stripe Configuration</CardTitle>
                            <CardDescription>
                                API Keys for payment processing. These are used by Edge Functions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {settings.filter(s => s.key.includes('STRIPE')).map(setting => (
                                <div key={setting.key} className="grid gap-2">
                                    <Label htmlFor={setting.key}>{setting.key}</Label>
                                    <Input
                                        id={setting.key}
                                        type={setting.is_secret ? "password" : "text"}
                                        value={setting.value}
                                        onChange={(e) => handleChange(setting.key, e.target.value)}
                                        placeholder={setting.description}
                                    />
                                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Fees & Payouts</CardTitle>
                            <CardDescription>
                                Configure platform fees and commission structures.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {settings.filter(s => !s.key.includes('STRIPE')).map(setting => (
                                <div key={setting.key} className="grid gap-2">
                                    <Label htmlFor={setting.key}>{setting.key}</Label>
                                    <Input
                                        id={setting.key}
                                        type="text"
                                        value={setting.value}
                                        onChange={(e) => handleChange(setting.key, e.target.value)}
                                        placeholder={setting.description}
                                    />
                                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    
                    <div className="mt-6 flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
