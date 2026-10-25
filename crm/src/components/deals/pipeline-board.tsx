"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EllipsisVertical } from "lucide-react";
import { DueChip } from "@/components/due-chip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BoardDeal } from "@/lib/data/deals";
import { formatAED } from "@/lib/money";
import { STAGES, contractValueFils, isClosed, positionBetween, type DealStage } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import { LostReasonDialog } from "./lost-reason-dialog";
import { STAGE_DOT } from "./stage-badge";
import { useMoveDeal } from "./use-move-deal";

type Columns = Record<DealStage, BoardDeal[]>;

function groupByStage(deals: BoardDeal[]): Columns {
  const columns = Object.fromEntries(STAGES.map((s) => [s, [] as BoardDeal[]])) as Columns;
  for (const deal of deals) columns[deal.stage].push(deal);
  for (const s of STAGES) columns[s].sort((a, b) => a.position - b.position);
  return columns;
}

const COLUMN_PREFIX = "column:";

/**
 * Kanban board. Drag cards between columns (mouse: click and drag; phone:
 * press and hold, then drag). Every card also has a "Move to…" menu.
 */
export function PipelineBoard({ deals }: { deals: BoardDeal[] }) {
  const t = useTranslations();
  const [columns, setColumns] = useState<Columns>(() => groupByStage(deals));
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const beforeDrag = useRef<Columns>(columns);
  const justDragged = useRef(false);

  // Fresh data from the server (after a save) replaces the local copy.
  const [prevDeals, setPrevDeals] = useState(deals);
  if (deals !== prevDeals) {
    setPrevDeals(deals);
    setColumns(groupByStage(deals));
  }

  const { request, lostDialog } = useMoveDeal({ onFailed: () => setColumns(beforeDrag.current) });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const stageOf = (id: UniqueIdentifier, cols = columns): DealStage | undefined => {
    const key = String(id);
    if (key.startsWith(COLUMN_PREFIX)) return key.slice(COLUMN_PREFIX.length) as DealStage;
    return STAGES.find((s) => cols[s].some((d) => d.id === key));
  };

  const activeDeal = activeId ? STAGES.flatMap((s) => columns[s]).find((d) => d.id === activeId) : undefined;

  function onDragStart({ active }: DragStartEvent) {
    beforeDrag.current = columns;
    setActiveId(active.id);
  }

  // While dragging over another column, move the card there so it can be placed.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = stageOf(active.id);
    const to = stageOf(over.id);
    if (!from || !to || from === to) return;
    setColumns((cols) => {
      const moving = cols[from].find((d) => d.id === active.id);
      if (!moving) return cols;
      const target = cols[to];
      const overIndex = target.findIndex((d) => d.id === over.id);
      const index = overIndex >= 0 ? overIndex : target.length;
      return {
        ...cols,
        [from]: cols[from].filter((d) => d.id !== active.id),
        [to]: [...target.slice(0, index), { ...moving, stage: to }, ...target.slice(index)],
      };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    // Dropping a card can also fire a click on it; ignore clicks for a moment.
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 250);
    if (!over) {
      setColumns(beforeDrag.current);
      return;
    }
    const stage = stageOf(active.id);
    if (!stage) return;

    // Re-order inside the column, then work out the card's new position number.
    let list = columns[stage];
    const oldIndex = list.findIndex((d) => d.id === active.id);
    const overIndex = list.findIndex((d) => d.id === over.id);
    if (overIndex >= 0 && overIndex !== oldIndex) list = arrayMove(list, oldIndex, overIndex);
    const index = list.findIndex((d) => d.id === active.id);
    const position = positionBetween(list[index - 1]?.position, list[index + 1]?.position);

    const originalStage = stageOf(active.id, beforeDrag.current);
    const originalIndex = originalStage ? beforeDrag.current[originalStage].findIndex((d) => d.id === active.id) : -1;
    if (originalStage === stage && originalIndex === index) {
      setColumns(beforeDrag.current);
      return;
    }

    list = list.map((d) => (d.id === active.id ? { ...d, stage, position } : d));
    setColumns({ ...columns, [stage]: list });
    request({ id: String(active.id), stage, position });
  }

  function moveFromMenu(deal: BoardDeal, stage: DealStage) {
    beforeDrag.current = columns;
    request({ id: deal.id, stage });
  }

  return (
    <>
      <DndContext
        id="pipeline-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setActiveId(null);
          setColumns(beforeDrag.current);
        }}
      >
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
          {STAGES.map((stage) => (
            <BoardColumn key={stage} stage={stage} deals={columns[stage]}>
              {columns[stage].map((deal) => (
                <SortableCard
                  key={deal.id}
                  deal={deal}
                  onMove={(s) => moveFromMenu(deal, s)}
                  wasJustDragged={() => justDragged.current}
                />
              ))}
            </BoardColumn>
          ))}
        </div>
        <DragOverlay>{activeDeal ? <DealCard deal={activeDeal} dragging /> : null}</DragOverlay>
      </DndContext>
      <p className="text-xs text-muted-foreground">{t("pipeline.closedNote")}</p>
      <LostReasonDialog {...lostDialog} />
    </>
  );
}

function BoardColumn({ stage, deals, children }: { stage: DealStage; deals: BoardDeal[]; children: React.ReactNode }) {
  const t = useTranslations();
  const { setNodeRef, isOver } = useDroppable({ id: COLUMN_PREFIX + stage });
  const total = deals.reduce((sum, d) => sum + contractValueFils(d), 0);

  return (
    <section
      aria-label={t(`options.stage.${stage}`)}
      className="flex w-[17rem] shrink-0 snap-start flex-col rounded-xl bg-muted/60 dark:bg-muted/40"
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className={cn("size-2 rounded-full", STAGE_DOT[stage])} />
        <h2 className="text-sm font-semibold">{t(`options.stage.${stage}`)}</h2>
        <span className="text-xs text-muted-foreground">{deals.length}</span>
        <span className="ms-auto text-xs font-medium text-muted-foreground">{formatAED(total, { compact: true })}</span>
      </header>
      <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "grid min-h-24 flex-1 content-start gap-2 rounded-b-xl px-2 pb-2 transition-colors",
            isOver && "bg-primary/5",
          )}
        >
          {children}
          {deals.length === 0 && (
            <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              {t("pipeline.emptyColumn")}
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableCard({
  deal,
  onMove,
  wasJustDragged,
}: {
  deal: BoardDeal;
  onMove: (stage: DealStage) => void;
  wasJustDragged: () => boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("touch-manipulation", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <DealCard deal={deal} onMove={onMove} wasJustDragged={wasJustDragged} />
    </div>
  );
}

function DealCard({
  deal,
  dragging,
  onMove,
  wasJustDragged,
}: {
  deal: BoardDeal;
  dragging?: boolean;
  onMove?: (stage: DealStage) => void;
  wasJustDragged?: () => boolean;
}) {
  const t = useTranslations();
  return (
    <article
      className={cn(
        "relative rounded-lg border bg-card p-3 text-sm shadow-xs select-none",
        dragging && "rotate-2 cursor-grabbing shadow-lg",
      )}
    >
      <div className="flex items-start gap-1">
        <Link
          href={`/deals/${deal.id}`}
          className="min-w-0 flex-1 font-medium leading-snug after:absolute after:inset-0 hover:underline"
          draggable={false}
          onClick={(e) => wasJustDragged?.() && e.preventDefault()}
        >
          <span className="line-clamp-2">{deal.title}</span>
        </Link>
        {onMove && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative z-10 -me-1 -mt-1 size-7 text-muted-foreground"
                aria-label={t("pipeline.moveTo")}
              >
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("pipeline.moveTo")}</DropdownMenuLabel>
              {STAGES.filter((s) => s !== deal.stage).map((s) => (
                <DropdownMenuItem key={s} onSelect={() => onMove(s)}>
                  <span className={cn("size-2 rounded-full", STAGE_DOT[s])} />
                  {t(`options.stage.${s}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {deal.company && <p className="mt-0.5 truncate text-xs text-muted-foreground">{deal.company.name}</p>}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold">
          {formatAED(deal.value_fils)}
          {deal.billing === "monthly" && <span className="font-normal text-muted-foreground">{t("deals.perMonth")}</span>}
        </span>
        <DueChip date={deal.next_follow_up_date} muted={isClosed(deal.stage)} />
      </div>
    </article>
  );
}
