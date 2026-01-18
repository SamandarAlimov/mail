import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

function calculateStrength(password: string): {
  score: number;
  label: string;
  requirements: Requirement[];
} {
  const requirements: Requirement[] = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains number", met: /[0-9]/.test(password) },
    { label: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const score = Math.min(metCount, 4);

  const labels = ["Weak", "Fair", "Good", "Strong", "Excellent"];
  const label = password.length === 0 ? "" : labels[score];

  return { score, label, requirements };
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { score, label, requirements } = useMemo(
    () => calculateStrength(password),
    [password]
  );

  if (!password) return null;

  const colors = [
    "bg-destructive",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-emerald-500",
  ];

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                i < score ? colors[score] : "bg-muted"
              )}
            />
          ))}
        </div>
        {label && (
          <p
            className={cn(
              "text-xs font-medium transition-colors",
              score <= 1 && "text-destructive",
              score === 2 && "text-yellow-500",
              score >= 3 && "text-green-500"
            )}
          >
            {label}
          </p>
        )}
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1">
        {requirements.map((req) => (
          <div
            key={req.label}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              req.met ? "text-green-500" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
