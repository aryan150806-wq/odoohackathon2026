---
name: booking-overlap
description: Booking overlap detection algorithm — half-open interval check with DB exclusion constraint and row-level locking to prevent race conditions on resource bookings.
---

# Booking Overlap Detection

## Core Algorithm

Two bookings overlap if and only if: `existing.startTime < requested.endTime AND existing.endTime > requested.startTime`

We use **half-open intervals** `[startTime, endTime)`:
- 9:00–10:00 and 10:00–11:00 do NOT overlap (10:00 is exclusive end of first, inclusive start of second)
- 9:00–10:00 and 9:30–10:30 DO overlap

## Implementation: Two Lines of Defense

### 1. Application-level check (in `hasOverlap()`)
```typescript
async hasOverlap(
  assetId: string,
  startTime: Date,
  endTime: Date,
  excludingBookingId?: string,
): Promise<{ overlaps: boolean; conflictingBooking?: Booking }> {
  return this.prisma.$transaction(async (tx) => {
    // Row-level lock on the asset to serialize concurrent booking attempts
    await tx.$queryRaw`SELECT 1 FROM "Asset" WHERE id = ${assetId} FOR UPDATE`;

    const conflict = await tx.booking.findFirst({
      where: {
        assetId,
        status: { notIn: ['CANCELLED'] },
        ...(excludingBookingId ? { id: { not: excludingBookingId } } : {}),
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    return conflict
      ? { overlaps: true, conflictingBooking: conflict }
      : { overlaps: false };
  }, { isolationLevel: 'Serializable' });
}
```

### 2. DB-level exclusion constraint (backup for race conditions)
```sql
-- Requires btree_gist extension
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking" ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    "assetId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
  ) WHERE (status != 'CANCELLED');
```

## Rules
1. Always call `hasOverlap()` inside a transaction with `SELECT ... FOR UPDATE`.
2. The DB exclusion constraint is a SECOND line of defense — do not rely on it alone.
3. Cancelled bookings are excluded from overlap checks.
4. When rescheduling, pass `excludingBookingId` to exclude the booking being rescheduled.
5. Validate that `startTime < endTime` before checking overlap.
6. All times are in UTC (timestamptz in Postgres).
