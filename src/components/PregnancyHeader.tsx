import { Heart } from 'lucide-react';
import { format, differenceInWeeks } from 'date-fns';

interface PregnancyHeaderProps {
  pregnancyStartDate: Date;
  dueDate: Date;
}

const PregnancyHeader = ({ pregnancyStartDate, dueDate }: PregnancyHeaderProps) => {
  const currentWeek = Math.min(
    40,
    differenceInWeeks(new Date(), pregnancyStartDate)
  );
  const progress = (currentWeek / 40) * 100;

  return (
    <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-primary/20 via-primary-light/30 to-secondary/20 backdrop-blur-sm border-2 border-primary/30 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Week {currentWeek}
          </h1>
          <p className="text-sm text-muted-foreground">
            Due: {format(dueDate, 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="p-4 rounded-full bg-primary/20 text-primary">
          <Heart className="w-8 h-8 fill-current animate-pulse" />
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary via-primary-light to-accent rounded-full transition-all duration-500 shadow-glow"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right mt-2">
        {40 - currentWeek} weeks remaining
      </p>
    </div>
  );
};

export default PregnancyHeader;
