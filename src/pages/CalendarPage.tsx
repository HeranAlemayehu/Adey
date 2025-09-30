import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Heart, Thermometer } from 'lucide-react';
import Layout from '@/components/Layout';
import ReadingCard from '@/components/ReadingCard';

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [readings, setReadings] = useState<any[]>([]);
  const [note, setNote] = useState<any>(null);

  useEffect(() => {
    if (selectedDate) {
      loadDayData(selectedDate);
    }
  }, [selectedDate]);

  const loadDayData = async (date: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateStr = format(date, 'yyyy-MM-dd');

      // Load readings for the day
      const { data: readingsData } = await supabase
        .from('device_readings')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_at', `${dateStr}T00:00:00`)
        .lte('recorded_at', `${dateStr}T23:59:59`)
        .order('recorded_at', { ascending: false });

      // Load note for the day
      const { data: noteData } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .single();

      setReadings(readingsData || []);
      setNote(noteData);
    } catch (error) {
      console.error('Error loading day data:', error);
    }
  };

  const avgReading = (field: string) => {
    if (readings.length === 0) return 0;
    const sum = readings.reduce((acc, r) => acc + (r[field] || 0), 0);
    return (sum / readings.length).toFixed(1);
  };

  const moodEmojis: Record<string, string> = {
    great: '💖',
    good: '😊',
    okay: '😐',
    tired: '😔',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
          <p className="text-muted-foreground">View your daily readings and notes</p>
        </div>

        <Card className="p-4 rounded-3xl border-2 bg-card shadow-card">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-2xl"
          />
        </Card>

        {selectedDate && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {format(selectedDate, 'MMMM d, yyyy')}
            </h2>

            {note && (
              <Card className="p-5 rounded-3xl border-2 bg-gradient-to-br from-card to-secondary/10 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-3xl">{moodEmojis[note.mood] || '😊'}</span>
                  <p className="font-semibold text-foreground capitalize">{note.mood}</p>
                </div>
                <p className="text-muted-foreground">{note.notes}</p>
              </Card>
            )}

            {readings.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <ReadingCard
                  icon={<Thermometer className="w-5 h-5" />}
                  label="Avg Temperature"
                  value={avgReading('temperature')}
                  unit="°C"
                />
                <ReadingCard
                  icon={<Activity className="w-5 h-5" />}
                  label="Total Kicks"
                  value={readings.reduce((sum, r) => sum + (r.kick_count || 0), 0)}
                  unit="kicks"
                />
                <ReadingCard
                  icon={<Heart className="w-5 h-5" />}
                  label="Avg Heartbeat"
                  value={avgReading('heartbeat')}
                  unit="bpm"
                  className="col-span-2"
                />
              </div>
            ) : (
              <Card className="p-6 rounded-3xl border-2 bg-muted/20 text-center">
                <p className="text-muted-foreground">No readings for this day</p>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CalendarPage;
