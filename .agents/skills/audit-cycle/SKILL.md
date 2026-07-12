---
name: audit-cycle
description: Audit cycle lifecycle — create, execute, and atomically close audit cycles with asset status updates in a single transaction.
---

# Audit Cycle Lifecycle

## States
```
Planned → In Progress → Completed
```

## Create Cycle
- Admin only.
- Scope: department OR location (not both).
- Date range (startDate, endDate).
- Assign one or more auditors (User IDs).
- Auto-populates AuditItems: one per asset matching the scope.
- Initial status: Planned.

## Execute Cycle
- Move to In Progress when first auditor starts verifying.
- Auditors mark each AuditItem as: Verified / Missing / Damaged.
- Each verification writes: verifiedById, verifiedAt, notes (optional).
- System auto-generates discrepancy report (items with status Missing or Damaged).

## Close Cycle (ATOMIC — single transaction)

```typescript
async closeCycle(cycleId: string, closedById: string): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    // 1. Lock the cycle row
    const cycle = await tx.auditCycle.findUnique({ where: { id: cycleId } });
    if (cycle.status !== 'IN_PROGRESS') throw new BadRequestException('Cycle not in progress');

    // 2. Check all items have been verified
    const unverified = await tx.auditItem.count({
      where: { auditCycleId: cycleId, status: 'PENDING' },
    });
    if (unverified > 0) throw new BadRequestException(`${unverified} items not yet verified`);

    // 3. Update cycle status
    await tx.auditCycle.update({
      where: { id: cycleId },
      data: { status: 'COMPLETED' },
    });

    // 4. Update asset statuses for flagged items
    const missingItems = await tx.auditItem.findMany({
      where: { auditCycleId: cycleId, status: 'MISSING' },
    });
    for (const item of missingItems) {
      await tx.asset.update({
        where: { id: item.assetId },
        data: { status: 'LOST' },
      });
    }

    // 5. Write activity log entries
    await tx.activityLog.create({
      data: {
        userId: closedById,
        action: 'AUDIT_CYCLE_CLOSED',
        entityType: 'AuditCycle',
        entityId: cycleId,
        details: {
          missingCount: missingItems.length,
          damagedCount: await tx.auditItem.count({
            where: { auditCycleId: cycleId, status: 'DAMAGED' },
          }),
        },
      },
    });
  });
}
```

## Rules
1. Closing a cycle MUST be atomic — all-or-nothing transaction.
2. Cannot close a cycle with unverified items — all must be Verified, Missing, or Damaged.
3. Missing assets → status becomes Lost.
4. Damaged assets → a maintenance request should be suggested (not auto-created).
5. Once closed (Completed), the cycle and its items are immutable.
6. Cycle history is retained indefinitely for audit trail.
