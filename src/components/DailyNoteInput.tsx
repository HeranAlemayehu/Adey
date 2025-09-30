import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Smile, Meh, Frown, Heart, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyNoteInputProps {
  onSave: (note: string, mood: string) => void;
  initialNote?: string;
  initialMood?: string;
}

const moods = [
  { icon: Heart, value: 'great', label: 'Great', color: 'text-accent' },
  { icon: Smile, value: 'good', label: 'Good', color: 'text-primary' },
  { icon: Meh, value: 'okay', label: 'Okay', color: 'text-peach' },
  { icon: Frown, value: 'tired', label: 'Tired', color: 'text-secondary' },
];

const DailyNoteInput = ({ onSave, initialNote = '', initialMood = '' }: DailyNoteInputProps) => {
  const [note, setNote] = useState(initialNote);
  const [selectedMood, setSelectedMood] = useState(initialMood);

  const handleSave = () => {
    onSave(note, selectedMood);
  };

  return (
    <Card className="p-5 rounded-3xl border-2 bg-gradient-to-br from-card to-secondary/10 shadow-card">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-primary" />
        How are you feeling today?
      </h3>
      
      {/* Mood Selector */}
      <div className="flex gap-3 mb-4">
        {moods.map((mood) => {
          const Icon = mood.icon;
          return (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={cn(
                "flex-1 p-3 rounded-2xl border-2 transition-all duration-300",
                selectedMood === mood.value
                  ? "border-primary bg-primary/10 scale-105"
                  : "border-border bg-muted/30 hover:bg-muted/50"
              )}
            >
              <Icon className={cn("w-6 h-6 mx-auto mb-1", mood.color)} />
              <p className="text-xs font-medium">{mood.label}</p>
            </button>
          );
        })}
      </div>

      {/* Note Input */}
      <Textarea
        placeholder="Write your thoughts, feelings, or any notes for today..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="mb-4 min-h-[100px] rounded-2xl border-2 bg-background/50 resize-none"
      />

      <Button 
        onClick={handleSave} 
        className="w-full rounded-full bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Save className="w-4 h-4 mr-2" />
        Save Today's Note
      </Button>
    </Card>
  );
};

export default DailyNoteInput;
