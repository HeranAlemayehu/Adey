import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Phone, Bell, Moon, Sun, LogOut } from 'lucide-react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<any>({
    notifications_enabled: true,
    emergency_monitoring_enabled: true,
  });
  const [contacts, setContacts] = useState<any[]>([]);
  const [newContact, setNewContact] = useState({ type: 'doctor', name: '', phone: '' });

  useEffect(() => {
    loadSettings();
    loadContacts();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSettings(data);
        setTheme(data.theme || 'light');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id);

      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const updateSettings = async (updates: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          ...updates,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const addContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user.id,
          contact_type: newContact.type,
          name: newContact.name,
          phone: newContact.phone,
        });

      if (error) throw error;

      setNewContact({ type: 'doctor', name: '', phone: '' });
      loadContacts();
      toast.success('Contact added');
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your app experience</p>
        </div>

        {/* Theme */}
        <Card className="p-6 rounded-3xl border-2 bg-card shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-primary" />
              )}
              <div>
                <Label className="text-foreground font-semibold">Theme</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => {
                const newTheme = checked ? 'dark' : 'light';
                setTheme(newTheme);
                updateSettings({ theme: newTheme });
              }}
            />
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 rounded-3xl border-2 bg-card shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <Label className="text-foreground font-semibold">Notifications</Label>
                <p className="text-sm text-muted-foreground">Reminders and alerts</p>
              </div>
            </div>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) => updateSettings({ notifications_enabled: checked })}
            />
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label className="text-foreground font-semibold">Emergency Monitoring</Label>
              <p className="text-sm text-muted-foreground">Auto-call on abnormal readings</p>
            </div>
            <Switch
              checked={settings.emergency_monitoring_enabled}
              onCheckedChange={(checked) => updateSettings({ emergency_monitoring_enabled: checked })}
            />
          </div>
        </Card>

        {/* Emergency Contacts */}
        <Card className="p-6 rounded-3xl border-2 bg-card shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="w-5 h-5 text-primary" />
            <Label className="text-foreground font-semibold">Emergency Contacts</Label>
          </div>

          <div className="space-y-3 mb-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="p-3 rounded-2xl bg-muted/30 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  <p className="text-xs text-muted-foreground capitalize">{contact.contact_type}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Select value={newContact.type} onValueChange={(value) => setNewContact({ ...newContact, type: value })}>
              <SelectTrigger className="rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="emergency">Emergency Contact</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Contact name"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              className="rounded-full"
            />
            <Input
              placeholder="Phone number"
              type="tel"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              className="rounded-full"
            />
            <Button onClick={addContact} className="w-full rounded-full">
              Add Contact
            </Button>
          </div>
        </Card>

        {/* Sign Out */}
        <Button
          onClick={handleSignOut}
          variant="destructive"
          size="lg"
          className="w-full rounded-full"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>
    </Layout>
  );
};

export default Settings;
