import { useEffect, useRef, useState } from "react";

interface Phase {
  label: string;
  until: number;
}

interface ProgressBarProps {
  isActive: boolean;
  isComplete: boolean;
  phases: Phase[];
  speed?: "normal" | "fast";
}

export default function ProgressBar({ isActive, isComplete, phases, speed = "normal" }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate progress while active
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(0);
      return;
    }
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        let inc: number;
        if (speed === "fast") {
          inc = prev < 50 ? 4.0 : prev < 80 ? 1.0 : 0.3;
        } else {
          inc = prev < 50 ? 1.0 : prev < 80 ? 0.3 : 0.06;
        }
        return Math.min(prev + inc, 90);
      });
    }, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, speed]);

  // Jump to 100% when complete
  useEffect(() => {
    if (isComplete) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
    }
  }, [isComplete]);

  if (!isActive) return null;

  const currentPhase = phases.find((p) => progress <= p.until) ?? phases[phases.length - 1];

  return (
    <div className="space-y-1.5">
      <div className="h-[3px] bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground font-mono">{currentPhase?.label}</p>
    </div>
  );
}
