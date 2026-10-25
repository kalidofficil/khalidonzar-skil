import { AtSign, Briefcase, Mail, MessageCircle, MessageSquareMore, Phone, Users, type LucideIcon } from "lucide-react";
import type { ActivityChannel } from "@/lib/types";
import { cn } from "@/lib/utils";

export const CHANNEL_ICON: Record<ActivityChannel, LucideIcon> = {
  whatsapp: MessageCircle,
  call: Phone,
  meeting: Users,
  email: Mail,
  linkedin: Briefcase,
  instagram: AtSign,
  other: MessageSquareMore,
};

const CHANNEL_COLOUR: Record<ActivityChannel, string> = {
  whatsapp: "bg-whatsapp/15 text-whatsapp",
  call: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  meeting: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  email: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  linkedin: "bg-blue-600/15 text-blue-700 dark:text-blue-400",
  instagram: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  other: "bg-muted text-muted-foreground",
};

export function ChannelIcon({ channel, className }: { channel: ActivityChannel; className?: string }) {
  const Icon = CHANNEL_ICON[channel];
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", CHANNEL_COLOUR[channel], className)}>
      <Icon className="size-4" />
    </span>
  );
}
