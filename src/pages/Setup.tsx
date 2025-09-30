import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Heart, Calendar } from 'lucide-react';
import { addWeeks } from 'date-fns';

const Setup = () => {
  const navigate = useNavigate();
  const [pregnancyStartDate, setPregnancyStartDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const startDate = new Date(pregnancyStartDate);
      const dueDate = addWeeks(startDate, 40);

      const { error } = await supabase
        .from('pregnancy_info')
        .insert({
          user_id: user.id,
          pregnancy_start_date: startDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
        });

      if (error) throw error;

      // Create default settings
      await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          theme: 'light',
          temperature_unit: 'celsius',
          notifications_enabled: true,
        });

      toast.success('Setup complete!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 rounded-3xl border-2 bg-card/95 backdrop-blur-sm shadow-soft">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-primary/20 mb-4">
            <Heart className="w-12 h-12 text-primary fill-current animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome!</h1>
          <p className="text-muted-foreground">
            Let's set up your pregnancy tracking
          </p>
        </div>

        <form onSubmit={handleSetup} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Pregnancy Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={pregnancyStartDate}
              onChange={(e) => setPregnancyStartDate(e.target.value)}
              required
              className="rounded-full"
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">
              Enter the first day of your last menstrual period
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full"
            size="lg"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Setup;
