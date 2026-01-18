import { useEffect } from "react";
import { toast } from "sonner";

export function useNotifications() {
  useEffect(() => {
    const timer1 = setTimeout(() => {
      toast("New email from Marcus Chen", {
        description: "Q4 Infrastructure Report — Action Required",
        duration: 5000,
      });
    }, 5000);

    const timer2 = setTimeout(() => {
      toast("AI Suggestion", {
        description: "3 emails need your attention today",
        duration: 5000,
      });
    }, 12000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);
}
