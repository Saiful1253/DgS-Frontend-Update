/**
 * Compile-time contract for the Services entities.
 *
 * This file emits no runtime behaviour. It exists so that a change to an entity's
 * column shape (a renamed FK, a dropped column) fails `tsc`/`nest build` instead of
 * silently diverging from the DTOs, seeds and raw queries that depend on it.
 *
 * If a check below errors, the entity and its consumers genuinely disagree.
 * Do not delete a check to silence it — update the entity and every consumer together.
 */
import type { Service } from './service.entity';
import type { ServiceGroup } from './service-group.entity';
import type { ServicePillar } from './service-pillar.entity';

/** Fails to compile unless `T` is exactly `true`. */
type Assert<T extends true> = T;

/** `true` when `K` is a declared key of `T`, `false` otherwise. */
type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;

/** Every listed key must exist on the entity. */
type HasAll<T, K extends PropertyKey> =
  HasKey<T, K> extends true
    ? true
    : { ERROR: `'${K & string}' is missing from this entity` };

/** No listed key may exist on the entity (catches rename leftovers). */
type HasNone<T, K extends PropertyKey> =
  HasKey<T, K> extends true
    ? { ERROR: `'${K & string}' should have been removed from this entity` }
    : true;

export type ServicePillarContract = [
  // Identity
  Assert<HasAll<ServicePillar, 'id' | 'name' | 'slug' | 'display_label'>>,
  // Presentation / filtering
  Assert<HasAll<ServicePillar, 'blurb' | 'icon' | 'display_order' | 'is_active' | 'is_deleted'>>,
  // Timestamps
  Assert<HasAll<ServicePillar, 'created_at' | 'updated_at'>>,
  // Relations
  Assert<HasAll<ServicePillar, 'groups' | 'services'>>,
];

export type ServiceGroupContract = [
  Assert<HasAll<ServiceGroup, 'id' | 'name' | 'slug' | 'display_order' | 'is_deleted'>>,
  // The FK that was previously only a `pillar` string. Keep this: raw queries in
  // ServicesService and the Milanova seed both bind `pillar_id` by name.
  Assert<HasKey<ServiceGroup, 'pillar_id'>>,
  Assert<HasKey<ServiceGroup, 'pillar'>>,
  Assert<HasNone<ServiceGroup, 'pillarId' | 'pillarID' | 'pillar_id_'>>,
  Assert<HasAll<ServiceGroup, 'created_at' | 'updated_at' | 'pillarEntity' | 'services'>>,
];

export type ServiceContract = [
  Assert<HasAll<Service, 'id' | 'name' | 'slug' | 'pillar' | 'is_active' | 'is_deleted'>>,
  Assert<HasKey<Service, 'pillar_id'>>,
  Assert<HasKey<Service, 'group_id'>>,
  Assert<HasNone<Service, 'pillarId' | 'groupId'>>,
  Assert<HasAll<Service, 'description' | 'icon_url' | 'created_at' | 'updated_at'>>,
  Assert<HasAll<Service, 'pillarEntity' | 'group'>>,
];

/**
 * Resolved entity types must stay assignable to what raw SQL and seeds produce.
 * `slug` is nullable on Service (legacy rows) but the picker treats it as a string,
 * so callers must keep a `||` fallback rather than assume non-null.
 */
export type ServiceSlugNullability = Assert<
  string extends Service['slug'] ? true : { ERROR: 'Service.slug must stay `string` (nullable in DB) so callers add a fallback' }
>;

/**
 * Relations MUST keep a string target, an `import type` sibling, and a `Relation<T>`
 * declared type. This cannot be pinned by a type assertion — see the note below — so
 * the rule is documented here instead.
 *
 * The three entities are mutually referential. An arrow-function target such as
 * `() => ServicePillar` makes TypeScript *infer* the target from a peer class that is
 * still mid-evaluation, so it resolves that class as a partial shape and reports
 * `pillar_id` / `pillarEntity` as missing. `tsc` can pass while an editor's language
 * service fails, which makes the drift very hard to spot. A string target carries no
 * inference, so the module cycle is harmless.
 *
 * Do NOT "fix" a relation error here by reverting to `() => Peer` targets, and do NOT
 * convert an `import type { Peer }` back to a value import. Neither is caught by
 * `tsc`: TypeORM's `Relation<T>` is a plain alias for `T`, and this project compiles
 * with `strictNullChecks: false`, so `Relation<Peer>` and `Peer | null` are the exact
 * same type. Verify changes with `npm run typecheck` AND by checking that the three
 * entity files import each other only via `import type`.
 */
