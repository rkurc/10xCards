import { toast as sonnerToast, type ToastT } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    if (variant === "destructive") {
      return sonnerToast.error(title, {
        description,
      });
    }
    
    return sonnerToast(title as string, {
      description,
    });
  };

  return { toast };
}