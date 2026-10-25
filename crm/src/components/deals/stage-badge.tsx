import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { DealStage } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

/** Colour dot per stage, also used on board column headers. */
export const STAGE_DOT: Record<DealStage, string> = {
  lead: "bg-slate-400",
  contacted: "bg-sky-500",
  discovery: "bg-violet-500",
  proposal: "bg-amber-500",
  negotiation: "bg-orange-500",
  won: "bg-success",
  lost: "bg-destructive",
};

export function StageBadge({ stage, className }: { stage: DealStage; className?: string }) {
  const t = useTranslations("options.stage");
  const variant = stage === "won" ? "success" : stage === "lost" ? "destructive" : "secondary";
  return (
    <Badge variant={variant} className={className}>
      <span className={cn("size-1.5 rounded-full", STAGE_DOT[stage])} />
      {t(stage)}
    </Badge>
  );
}
