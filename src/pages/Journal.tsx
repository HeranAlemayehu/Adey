import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Search, Heart, Smile, Meh, Frown } from 'lucide-react';
import Layout from '@/components/Layout';

const moodIcons: Record<string, any> = {
  great: Heart,
  good: Smile,
  okay: Meh,
  tired: Frown,
};

const moodColors: Record<string, string> = {
  great: 'text-accent',
  good: 'text-primary',
  okay: 'text-peach',
  tired: 'text-secondary',
};

const Journal = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.mood?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse text-primary">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Journal</h1>
          <p className="text-muted-foreground">Your pregnancy journey notes</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 rounded-full border-2 bg-card/50"
          />
        </div>

        {/* Notes List */}
        <div className="space-y-4">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => {
              const MoodIcon = moodIcons[note.mood] || Smile;
              const moodColor = moodColors[note.mood] || 'text-primary';

              return (
                <Card
                  key={note.id}
                  className="p-5 rounded-3xl border-2 bg-gradient-to-br from-card to-primary-light/5 shadow-card hover:shadow-soft transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-primary/10 ${moodColor}`}>
                        <MoodIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {format(new Date(note.date), 'MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {note.mood}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-foreground leading-relaxed">{note.notes}</p>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 rounded-3xl border-2 bg-muted/20 text-center">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No notes found' : 'Start writing your first note from the Home page'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Journal;
