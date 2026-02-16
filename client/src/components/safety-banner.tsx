import { AlertTriangle } from "lucide-react";

export function SafetyBanner() {
  return (
    <div
      data-testid="safety-banner"
      className="w-full bg-destructive/10 dark:bg-destructive/15 border-b border-destructive/20 px-4 py-2"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        <p className="text-destructive dark:text-red-400">
          <span className="font-semibold">Informational Only</span> — All
          recommendations require review by a licensed MD. Peptides are often
          for research use only. Not medical advice.
        </p>
      </div>
    </div>
  );
}
