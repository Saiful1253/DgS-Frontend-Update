/**
 * Slot-preserving renumbering for drag-and-drop reordering.
 *
 * A reorder handler is handed one *page* of a server-paginated table, not the
 * whole table. Reassigning `index * 10` across that page restarts numbering at
 * 0 on every page, so page 1 writes 0,10,20… and page 2 writes 0,10,20… again.
 * The duplicate `display_order` values make the public ordering ambiguous, and
 * nothing in the admin UI shows the collision because the clashing rows are on
 * a page nobody is looking at.
 *
 * Instead, keep the `display_order` values this page already owns and hand them
 * back out in the new sequence. The result is always a permutation of the input
 * slots, so rows outside the page keep their position and no two written rows
 * can collide — regardless of which page the drag happened on, or which column
 * the table happened to be sorted by.
 */

export interface Orderable {
  id: number;
  display_order: number;
}

/** Ascending, de-duplicated slot values owned by `original`. */
function slotLadder(original: readonly Orderable[]): number[] {
  const values = original.map((item) => item.display_order);
  const unique = [...new Set(values)].sort((a, b) => a - b);

  if (unique.length === values.length) return unique;

  // Legacy rows can already carry duplicate orders. Rebuild a strictly
  // increasing ladder across the same range so the repair is deterministic
  // rather than dependent on insertion order.
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = values.length > 1 ? Math.max(1, Math.ceil((max - min + 1) / values.length)) : 1;
  return Array.from({ length: values.length }, (_, i) => min + i * step);
}

/**
 * Assign `original`'s slots to `reordered` positionally.
 *
 * @param original  the list as loaded, before the drag
 * @param reordered the same rows in their new sequence
 */
export function assignSlotOrders<T extends Orderable>(
  original: readonly T[],
  reordered: readonly T[],
): T[] {
  const slots = slotLadder(original);
  return reordered.map((item, index) => ({ ...item, display_order: slots[index] ?? item.display_order }));
}

/** Flatten to the `{ id, display_order }[]` payload the reorder endpoints take. */
export function toReorderPayload<T extends Orderable>(items: readonly T[]) {
  return items.map((item) => ({ id: item.id, display_order: item.display_order }));
}
