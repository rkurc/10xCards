import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { CardDTO } from "../../types";

interface CardViewDialogProps {
  card: CardDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export default function CardViewDialog({
  card,
  open,
  onOpenChange,
  onPrevious,
  onNext,
  hasNext = false,
  hasPrevious = false,
}: CardViewDialogProps) {
  const [showBack, setShowBack] = useState(false);

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg dialog-content-opaque">
        <DialogHeader>
          <DialogTitle>Fiszka</DialogTitle>
          <DialogDescription>Kliknij na treść, aby odwrócić fiszkę</DialogDescription>
        </DialogHeader>
        
        <div 
          className="min-h-[200px] border rounded-lg flex items-center justify-center p-6 my-4 cursor-pointer select-none transition-all transform hover:shadow-md"
          onClick={() => setShowBack(!showBack)}
        >
          <div className="text-center text-lg">
            {showBack ? card.back_content : card.front_content}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            {hasPrevious && (
              <Button variant="outline" size="sm" onClick={onPrevious}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Poprzednia
              </Button>
            )}
            {hasNext && (
              <Button variant="outline" size="sm" onClick={onNext}>
                Następna
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showBack ? "default" : "outline"} 
              size="sm" 
              onClick={() => setShowBack(true)}
              disabled={showBack}
            >
              Tył
            </Button>
            <Button 
              variant={!showBack ? "default" : "outline"} 
              size="sm" 
              onClick={() => setShowBack(false)}
              disabled={!showBack}
            >
              Przód
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
