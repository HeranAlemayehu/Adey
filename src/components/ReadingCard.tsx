import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ReadingCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
}

const ReadingCard = ({ icon, label, value, unit, className }: ReadingCardProps) => {
  return (
    <Card className={cn(
      "p-5 rounded-3xl border-2 backdrop-blur-sm shadow-card transition-all duration-300 hover:shadow-soft",
      "bg-gradient-to-br from-card to-primary-light/10",
      className
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
      </div>
    </Card>
  );
};

export default ReadingCard;
