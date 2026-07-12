---
name: asset-lifecycle
description: Asset status state machine — defines valid transitions and enforcement logic for Asset entity lifecycle (Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed).
---

# Asset Lifecycle State Machine

## Valid Transitions

```
Available → Allocated        (via allocation)
Available → Reserved         (via booking confirmation)
Available → Under Maintenance (via maintenance approval)
Available → Retired          (admin action)
Available → Lost             (via audit closure)

Allocated → Available        (via return)
Allocated → Lost             (via audit closure)

Reserved → Available         (booking completes or cancelled)

Under Maintenance → Available (maintenance resolved)

Retired → Disposed           (admin action)
```

## Invalid Transitions (reject with 400)
- Any transition not listed above is invalid.
- Cannot go from Disposed to any state.
- Cannot go from Lost to Available without admin override.
- Cannot allocate an asset that is not Available.
- Cannot book an asset that is not Available or already booked for the same slot.

## Implementation Rules
1. All transitions MUST go through `AssetStateMachine.transition(asset, targetStatus, context)`.
2. The function validates the transition is allowed, performs the update in a transaction, and writes an ActivityLog entry.
3. Route handlers MUST NOT set `asset.status` directly — always call the state machine.
4. The state machine function lives in `backend/src/assets/asset-state-machine.service.ts`.

## Function Signature
```typescript
class AssetStateMachineService {
  async transition(
    assetId: string,
    targetStatus: AssetStatus,
    context: {
      triggeredBy: string;      // userId
      reason: string;           // e.g., "allocation", "maintenance_approved"
      relatedEntityId?: string; // allocationId, maintenanceRequestId, etc.
    },
    tx?: PrismaTransactionClient, // optional — use if already in a transaction
  ): Promise<Asset>;
}
```
