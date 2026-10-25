import { useTranslations } from "next-intl";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { formatPhone, telLink, whatsappLink } from "@/lib/phone";
import { cn } from "@/lib/utils";

type Props = {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  /** compact: icon buttons only (lists). full: labelled buttons + copy (detail pages). */
  variant?: "compact" | "full";
  className?: string;
};

/** WhatsApp / call / email buttons for a contact. */
export function ContactActions({ phone, whatsapp, email, variant = "full", className }: Props) {
  const t = useTranslations("contacts");
  const wa = whatsappLink(whatsapp ?? phone);
  const tel = telLink(phone);
  const compact = variant === "compact";

  if (!wa && !tel && !email) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {wa && (
        <Button asChild variant="whatsapp" size={compact ? "icon-sm" : "sm"}>
          <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={t("whatsapp")} title={t("whatsapp")}>
            <MessageCircle />
            {!compact && t("whatsapp")}
          </a>
        </Button>
      )}
      {tel && (
        <Button asChild variant="outline" size={compact ? "icon-sm" : "sm"}>
          <a href={tel} aria-label={t("call")} title={t("call")}>
            <Phone />
            {!compact && <span dir="ltr">{formatPhone(phone)}</span>}
          </a>
        </Button>
      )}
      {!compact && phone && <CopyButton value={phone} label={t("copyPhone")} />}
      {email && (
        <Button asChild variant="outline" size={compact ? "icon-sm" : "sm"}>
          <a href={`mailto:${email}`} aria-label={t("email")} title={email}>
            <Mail />
            {!compact && <span className="max-w-48 truncate">{email}</span>}
          </a>
        </Button>
      )}
      {!compact && email && <CopyButton value={email} label={t("copyEmail")} />}
    </div>
  );
}
