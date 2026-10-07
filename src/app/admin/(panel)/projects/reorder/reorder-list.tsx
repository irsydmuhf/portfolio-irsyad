"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { reorderProjects } from "../../../project-actions";
import { BTN_PRIMARY } from "../editors";

interface Row {
  id: string;
  title: string;
  category: string;
  status: "draft" | "published";
  featured: boolean;
}

function SortableRow({
  row,
  index,
  total,
  onMove,
}: {
  row: Row;
  index: number;
  total: number;
  onMove: (d: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-lg border bg-white p-3 ${
        isDragging ? "border-orange-400 shadow-lg" : "border-navy-200"
      }`}
    >
      <button
        type="button"
        aria-label={`Drag ${row.title}. Space to lift, arrow keys to move.`}
        className="cursor-grab touch-none rounded p-1 text-navy-400 hover:bg-slate-100"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="w-6 text-center text-xs font-semibold text-navy-400">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-navy-900">{row.title}</p>
        <p className="text-xs text-navy-500">{row.category || "No category"}</p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          row.status === "published"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {row.status === "published" ? "Published" : "Draft"}
      </span>
      {row.featured ? (
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
          Featured
        </span>
      ) : null}
      <div className="flex gap-1">
        <button
          type="button"
          aria-label={`Move ${row.title} up`}
          disabled={index === 0}
          onClick={() => onMove(-1)}
          className="rounded border border-navy-200 p-1 disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={`Move ${row.title} down`}
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          className="rounded border border-navy-200 p-1 disabled:opacity-30"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export default function ReorderList({ initial }: { initial: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [saved, setSaved] = useState(initial.map((r) => r.id).join());
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  const [pending, start] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const dirty = rows.map((r) => r.id).join() !== saved;

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setRows((rs) =>
      arrayMove(
        rs,
        rs.findIndex((r) => r.id === active.id),
        rs.findIndex((r) => r.id === over.id)
      )
    );
  }

  function move(i: number, d: -1 | 1) {
    setRows((rs) => arrayMove(rs, i, i + d));
  }

  function save() {
    start(async () => {
      const r = await reorderProjects(rows.map((x) => x.id));
      if (r.ok) {
        setSaved(rows.map((x) => x.id).join());
        setMessage({ kind: "ok", text: "Order saved." });
        router.refresh();
      } else setMessage({ kind: "error", text: r.error });
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {message ? (
        <p
          role={message.kind === "error" ? "alert" : "status"}
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.kind === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={rows.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-2">
            {rows.map((r, i) => (
              <SortableRow
                key={r.id}
                row={r}
                index={i}
                total={rows.length}
                onMove={(d) => move(i, d)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={save}
        disabled={!dirty || pending}
        className={BTN_PRIMARY}
      >
        {pending ? "Saving…" : "Save order"}
      </button>
    </div>
  );
}
