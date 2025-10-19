import { useState } from "react";
import { MessageCircle, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const faqs = [
  {
    question: "Is it safe to exercise while pregnant?",
    answer: "Yes, most pregnant women can safely exercise, such as walking, swimming, or prenatal yoga. Avoid activities with high risk of falling or abdominal trauma. Always consult your doctor before starting a new routine."
  },
  {
    question: "How do I count my baby's kicks?",
    answer: "Pick a consistent time each day, usually when your baby is most active. Sit or lie down, place your hands on your belly, and count each movement until you reach 10."
  },
  {
    question: "How many times should my baby move each day?",
    answer: "After 28 weeks, most babies move at least 10 times within 2 hours during active periods. Movements vary daily, so focus on overall patterns rather than exact counts."
  },
  {
    question: "What does it mean if my baby is moving less than usual?",
    answer: "A noticeable decrease in movement may indicate that your baby needs medical attention. Contact your healthcare provider promptly for advice."
  },
  {
    question: "When should I start tracking fetal movements?",
    answer: "Most women start noticing fetal movements between 18–25 weeks. You can start regular tracking around 28 weeks for more consistent monitoring."
  },
  {
    question: "What positions are best for feeling my baby move?",
    answer: "Sitting or lying on your left side is usually best. This position increases blood flow and makes it easier to feel movements."
  },
  {
    question: "Can my baby's movements change throughout the day?",
    answer: "Yes. Babies often have periods of activity and rest. Movements may be stronger in the evening or after meals."
  },
  {
    question: "What should I do if I notice a sudden decrease in movements?",
    answer: "Lie down, relax, and try to gently stimulate your baby by drinking something cold or sweet. If movements remain low, contact your healthcare provider immediately."
  },
  {
    question: "How can I tell the difference between normal movements and worrying signs?",
    answer: "Normal patterns include consistent movements, with active and quiet periods. Worrying signs include a significant reduction or absence of movement compared to your usual pattern."
  },
  {
    question: "Can fetal movement tracking help detect problems early?",
    answer: "Yes. Consistent monitoring helps you notice changes in your baby's activity, which can prompt timely medical attention if something is wrong."
  }
];

const FloatingFAQ = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<typeof faqs[0] | null>(null);

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* FAQ Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Pregnancy FAQ</DialogTitle>
          </DialogHeader>

          {!selectedFAQ ? (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-2">
                {faqs.map((faq, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedFAQ(faq)}
                    className="w-full text-left p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center justify-between gap-2"
                  >
                    <span className="text-sm font-medium">{faq.question}</span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col">
              <Button
                variant="ghost"
                onClick={() => setSelectedFAQ(null)}
                className="self-start mb-4"
              >
                ← Back to questions
              </Button>
              <Card className="p-4 flex-1">
                <h3 className="font-semibold mb-3 text-primary">
                  {selectedFAQ.question}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedFAQ.answer}
                </p>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingFAQ;
