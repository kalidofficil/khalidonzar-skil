"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, LoaderCircle, Paperclip, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  getCompanyLogOptions,
  getLogOptions,
  saveActivity,
  type LogOptions,
} from "@/app/(app)/activities/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { CHANNELS } from "@/lib/activities";
import { addDays, dubaiNowLocalInput, toDubaiLocalInput, todayInDubai } from "@/lib/dates";
import { initialFormState, type FormState } from "@/lib/forms";
import { isClosed } from "@/lib/pipeline";
import type { Activity, ActivityChannel, DealStage } from "@/lib/types";
import { uploadFiles } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { CHANNEL_ICON } from "./channel-icon";

/** The fields of an activity this form can edit. */
type EditableActivity = Pick<
  Activity,
  "id" | "company_id" | "deal_id" | "contact_id" | "occurred_at" | "channel" | "summary" | "outcome" | "next_step" | "next_step_date"
>;

type Props = {
  /** Pre-select this company (e.g. on a company page). */
  companyId?: string | null;
  /** Pre-select this deal (e.g. on a deal page). */
  dealId?: string | null;
  /** Edit an existing activity instead of logging a new one. */
  activity?: EditableActivity;
  variant?: "button" | "fab" | "icon";
};

/**
 * "Log activity": a quick form for recording a call, message or meeting.
 * The minimum is channel + one sentence; everything else is optional.
 */
export function LogActivityButton({ companyId, dealId, activity, variant = "button" }: Props) {
  const t = useTranslations("activities");
  const [open, setOpen] = useState(false);

  const trigger =
    variant === "fab" ? (
      <Button
        size="lg"
        className="fixed end-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full p-0 shadow-lg md:hidden"
        aria-label={t("log")}
      >
        <Plus className="size-6" />
      </Button>
    ) : variant === "icon" ? (
      <Button variant="ghost" size="icon-sm" aria-label={t("edit")}>
        <Pencil />
      </Button>
    ) : (
      <Button size="sm">
        <Plus />
        {t("log")}
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      {open && (
        <LogActivityForm
          companyId={activity?.company_id ?? companyId ?? null}
          dealId={activity ? activity.deal_id : (dealId ?? null)}
          activity={activity}
          onDone={() => setOpen(false)}
        />
      )}
    </Dialog>
  );
}

function LogActivityForm({
  companyId: initialCompanyId,
  dealId: initialDealId,
  activity,
  onDone,
}: {
  companyId: string | null;
  dealId: string | null;
  activity?: EditableActivity;
  onDone: () => void;
}) {
  const t = useTranslations();
  const f = useTranslations("activities.fields");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<FormState>(initialFormState);

  const [options, setOptions] = useState<LogOptions | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(initialCompanyId);
  const [contacts, setContacts] = useState<{ id: string; full_name: string }[]>([]);
  const [deals, setDeals] = useState<{ id: string; title: string; stage: DealStage }[]>([]);
  const [dealId, setDealId] = useState<string>(initialDealId ?? "");
  const [channel, setChannel] = useState<ActivityChannel>(activity?.channel ?? "whatsapp");
  const [nextDate, setNextDate] = useState(activity?.next_step_date ?? "");
  const [showMore, setShowMore] = useState(Boolean(activity));
  const [files, setFiles] = useState<File[]>([]);
  const summaryRef = useRef<HTMLTextAreaElement>(null);

  // Load the company list (and, from a deal page, the deal's company).
  useEffect(() => {
    getLogOptions(initialDealId).then((o) => {
      setOptions(o);
      if (!initialCompanyId && o.companyId) setCompanyId(o.companyId);
    });
  }, [initialCompanyId, initialDealId]);

  // Load contacts and deals whenever the company changes.
  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    getCompanyLogOptions(companyId).then((o) => {
      if (cancelled) return;
      setContacts(o.contacts);
      setDeals(o.deals);
      // If the company has exactly one open deal, assume the activity is about it.
      const open = o.deals.filter((d) => !isClosed(d.stage));
      if (!activity && !initialDealId && open.length === 1) setDealId(open[0].id);
    });
    return () => {
      cancelled = true;
    };
  }, [companyId, activity, initialDealId]);

  const company = options?.companies.find((c) => c.id === companyId);
  const today = todayInDubai();
  const quickDates = [
    { label: t("common.tomorrow"), value: addDays(today, 1) },
    { label: t("common.in3Days"), value: addDays(today, 3) },
    { label: t("common.nextWeek"), value: addDays(today, 7) },
  ];
  const err = (name: string) => state.errors?.[name];

  function submit(form: HTMLFormElement) {
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await saveActivity(initialFormState, formData);
      setState(result);
      if (!result.ok || !result.id || !companyId) return;

      if (files.length) {
        const { failed, tooBig } = await uploadFiles(files, {
          companyId,
          dealId: dealId || null,
          activityId: result.id,
        });
        tooBig.forEach((name) => toast.error(t("files.tooBig", { name })));
        failed.forEach((name) => toast.error(t("files.failed", { name })));
      }
      toast.success(activity ? t("activities.updated") : t("activities.saved"));
      onDone();
      router.refresh();
    });
  }

  return (
    <DialogContent closeLabel={t("common.close")} onOpenAutoFocus={(e) => {
      // Jump straight to the text box when we already know the company.
      if (companyId) {
        e.preventDefault();
        summaryRef.current?.focus();
      }
    }}>
      <DialogTitle>{activity ? t("activities.edit") : t("activities.log")}</DialogTitle>
      <DialogDescription className="sr-only">{t("activities.fields.summary")}</DialogDescription>

      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
      >
        {activity && <input type="hidden" name="id" value={activity.id} />}
        <input type="hidden" name="company_id" value={companyId ?? ""} />
        <input type="hidden" name="channel" value={channel} />
        <input type="hidden" name="next_step_date" value={nextDate} />

        {state.message && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t.has(`errors.${state.message}` as never) ? t(`errors.${state.message}` as never) : t("errors.generic")}
          </p>
        )}

        {/* Company */}
        {company && (activity || initialCompanyId) ? (
          <p className="text-sm font-medium">{company.name}</p>
        ) : (
          <CompanyPicker
            companies={options?.companies}
            value={companyId}
            onChange={(id) => {
              setCompanyId(id);
              setDealId("");
              setContacts([]);
              setDeals([]);
              if (id) setTimeout(() => summaryRef.current?.focus(), 0);
            }}
            error={err("company_id")}
          />
        )}

        {/* Channel: one tap */}
        <div role="radiogroup" aria-label={f("channel")} className="flex flex-wrap gap-1.5">
          {CHANNELS.map((c) => {
            const Icon = CHANNEL_ICON[c];
            const selected = c === channel;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setChannel(c);
                  // Picking a channel moves straight on to typing.
                  summaryRef.current?.focus();
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
                )}
              >
                <Icon className="size-3.5" />
                {t(`options.channel.${c}`)}
              </button>
            );
          })}
        </div>

        <Field id="summary" label={f("summary")} errors={err("summary")}>
          <Textarea
            ref={summaryRef}
            id="summary"
            name="summary"
            required
            rows={3}
            placeholder={f("summaryPlaceholder")}
            defaultValue={state.values?.summary ?? activity?.summary ?? ""}
          />
        </Field>

        {deals.length > 0 && (
          <Field id="deal_id" label={f("deal_id")} errors={err("deal_id")} optional>
            <NativeSelect id="deal_id" name="deal_id" value={dealId} onChange={(e) => setDealId(e.target.value)}>
              <option value="">—</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                  {isClosed(d.stage) ? ` (${t(`options.stage.${d.stage}`)})` : ""}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}

        {/* Next follow-up: one tap */}
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">
            {t("deals.fields.next_follow_up_date")}{" "}
            <span className="font-normal text-muted-foreground">({t("common.optional")})</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {quickDates.map((q) => (
              <button
                key={q.value}
                type="button"
                aria-pressed={nextDate === q.value}
                onClick={() => setNextDate(nextDate === q.value ? "" : q.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm",
                  nextDate === q.value ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-accent",
                )}
              >
                {q.label}
              </button>
            ))}
            <Input
              type="date"
              aria-label={f("next_step_date")}
              value={nextDate}
              min={today}
              onChange={(e) => setNextDate(e.target.value)}
              className="h-9 w-auto"
            />
          </div>
          {dealId && <p className="text-xs text-muted-foreground">{f("nextStepHint")}</p>}
          {err("next_step_date") && <p className="text-xs text-destructive">{t("errors.invalidDate")}</p>}
        </div>

        {/* Everything else */}
        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          aria-expanded={showMore}
        >
          <ChevronDown className={cn("size-4 transition-transform", showMore && "rotate-180")} />
          {t("activities.moreDetails")}
        </button>

        <div className={cn("grid gap-4", !showMore && "hidden")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="occurred_at" label={f("occurred_at")} errors={err("occurred_at")}>
              <Input
                id="occurred_at"
                name="occurred_at"
                type="datetime-local"
                defaultValue={
                  state.values?.occurred_at ??
                  (activity ? toDubaiLocalInput(activity.occurred_at) : dubaiNowLocalInput())
                }
              />
            </Field>
            <Field id="contact_id" label={f("contact_id")} errors={err("contact_id")} optional>
              <NativeSelect
                id="contact_id"
                name="contact_id"
                defaultValue={activity?.contact_id ?? ""}
                key={contacts.length}
              >
                <option value="">—</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <Field id="outcome" label={f("outcome")} errors={err("outcome")} optional>
            <Input id="outcome" name="outcome" defaultValue={state.values?.outcome ?? activity?.outcome ?? ""} />
          </Field>
          <Field id="next_step" label={f("next_step")} errors={err("next_step")} optional>
            <Input id="next_step" name="next_step" defaultValue={state.values?.next_step ?? activity?.next_step ?? ""} />
          </Field>
          <FilePicker files={files} onChange={setFiles} />
        </div>

        <Button type="submit" size="lg" disabled={pending || !companyId}>
          {pending && <LoaderCircle className="animate-spin" />}
          {pending ? t("common.saving") : t("common.save")}
        </Button>
      </form>
    </DialogContent>
  );
}

/** Type-to-find company picker. Recently contacted companies come first. */
function CompanyPicker({
  companies,
  value,
  onChange,
  error,
}: {
  companies?: { id: string; name: string }[];
  value: string | null;
  onChange: (id: string | null) => void;
  error?: string[];
}) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const selected = companies?.find((c) => c.id === value);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = companies ?? [];
    return (q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list).slice(0, 6);
  }, [companies, query]);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <span className="font-medium">{selected.name}</span>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(null)} aria-label={t("common.edit")}>
          <X />
        </Button>
      </div>
    );
  }

  return (
    <Field id="company_search" label={t("activities.fields.company")} errors={error}>
      <Input
        id="company_search"
        autoFocus
        autoComplete="off"
        placeholder={t("activities.fields.companyPlaceholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matches[0]) {
            e.preventDefault();
            onChange(matches[0].id);
          }
        }}
      />
      {!companies ? (
        <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <ul className="grid gap-1">
          {matches.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onChange(c.id)}
                className="w-full rounded-md px-3 py-2 text-start text-sm hover:bg-accent"
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}

function FilePicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const t = useTranslations("activities.fields");
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => inputRef.current?.click()}>
        <Paperclip />
        {t("files")}
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          onChange([...files, ...Array.from(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      {files.length > 0 && (
        <ul className="grid gap-1 text-sm">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-2">
              <Paperclip className="size-3.5 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                aria-label="Remove"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
