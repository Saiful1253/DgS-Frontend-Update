"use client";

import React, { useMemo } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface SortableItemApi {
  /** Spread on the card root. */
  rootProps: Record<string, unknown>;
  /** Spread on the drag handle only — lets the rest of the card stay clickable. */
  handleProps: Record<string, unknown>;
  isDragging: boolean;
  isOver: boolean;
}

interface Props<T> {
  items: T[];
  getKey: (item: T) => number | string;
  /** Receives the reordered list. Persisting it is the caller's job. */
  onReorder: (next: T[]) => void;
  /** Renders the same markup, with no drag behaviour — for read-only viewers. */
  disabled?: boolean;
  className?: string;
  children: (item: T, api: SortableItemApi) => React.ReactNode;
}

/**
 * Sortable grid on dnd-kit.
 *
 * The three service managers used native HTML5 drag-and-drop, whose events never
 * fire for touch input — the grip was draggable with a mouse and inert on a phone
 * or tablet, and there was no keyboard path at all. dnd-kit is already a
 * dependency, so this wraps it once instead of triplicating sensor/strategy
 * wiring in each manager.
 */
export default function SortableGrid<T>({
  items,
  getKey,
  onReorder,
  disabled = false,
  className,
  children,
}: Props<T>) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    // A small activation distance keeps an ordinary click from starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = useMemo(() => items.map(getKey), [items, getKey]);

  if (!mounted || disabled) {
    return (
      <div className={className}>
        {items.map((item) => (
          <div key={getKey(item)} className="h-full">
            {children(item, {
              rootProps: {},
              handleProps: {},
              isDragging: false,
              isOver: false,
            })}
          </div>
        ))}
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(active.id as UniqueIdentifier);
    const newIndex = ids.indexOf(over.id as UniqueIdentifier);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext
      id="sortable-grid-dnd-context"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className={className}>
          {items.map((item) => (
            <SortableRow key={getKey(item)} id={getKey(item)}>
              {(api) => children(item, api)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  children,
}: {
  id: number | string;
  children: (api: SortableItemApi) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id });

  return (
    <div ref={setNodeRef} className="h-full" style={{ transform: CSS.Transform.toString(transform), transition }}>
      {children({
        rootProps: { ...attributes },
        handleProps: { ...listeners },
        isDragging,
        isOver,
      })}
    </div>
  );
}
