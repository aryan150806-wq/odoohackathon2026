# AssetFlow — Data Model Reference

> Authoritative data model for the AssetFlow enterprise asset management system.
> Keep this document in sync with `backend/prisma/schema.prisma`.

## Entities

### User (Employee)
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | String | Unique, validated |
| passwordHash | String | bcrypt cost 12 |
| name | String | Full name |
| role | Role enum | Default: EMPLOYEE. Set only via Admin promotion. |
| departmentId | UUID? | FK → Department |
| status | UserStatus | ACTIVE / INACTIVE |
| createdAt | DateTime | Auto |
| updatedAt | DateTime | Auto |

### Department
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Unique |
| parentId | UUID? | Self-relation for hierarchy |
| headId | UUID? | FK → User (Department Head) |
| status | DeptStatus | ACTIVE / INACTIVE |

### AssetCategory
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Unique (Electronics, Furniture, Vehicles, etc.) |
| description | String? | |
| customFields | JSON | Flexible field schema per category (e.g., warrantyPeriod for Electronics) |

### Asset
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Display name |
| assetTag | String | Unique, auto-generated server-side: `AF-XXXX` |
| serialNumber | String? | Manufacturer serial |
| categoryId | UUID | FK → AssetCategory |
| departmentId | UUID? | FK → Department (owning department) |
| status | AssetStatus | Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed |
| acquisitionDate | DateTime | When acquired |
| acquisitionCost | Decimal? | For reporting only — NOT accounting |
| condition | String | Current physical condition |
| location | String? | Physical location |
| isBookable | Boolean | If true, appears in Resource Booking (Screen 6) |
| photos | JSON | Array of file paths/URLs |
| documents | JSON | Array of file paths/URLs |

### Allocation
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| assetId | UUID | FK → Asset |
| userId | UUID | FK → User (allocated to) |
| departmentId | UUID? | FK → Department |
| status | AllocationStatus | ACTIVE, RETURNED, TRANSFERRED |
| allocatedAt | DateTime | When allocated |
| expectedReturnDate | DateTime? | Optional, used for overdue detection |
| returnedAt | DateTime? | When actually returned |
| returnConditionNotes | String? | Condition at check-in |
| allocatedById | UUID | FK → User (who performed the allocation) |

### TransferRequest
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| allocationId | UUID | FK → Allocation (current active allocation) |
| fromUserId | UUID | FK → User (current holder) |
| toUserId | UUID | FK → User (requested new holder) |
| status | TransferStatus | REQUESTED, APPROVED, REJECTED, COMPLETED |
| requestedAt | DateTime | Auto |
| approvedById | UUID? | FK → User (who approved) |
| approvedAt | DateTime? | |
| reason | String? | Why transfer is needed |

### Booking
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| assetId | UUID | FK → Asset (where isBookable=true) |
| userId | UUID | FK → User (who booked) |
| startTime | DateTime | Start of booking slot (inclusive) |
| endTime | DateTime | End of booking slot (exclusive — half-open interval) |
| status | BookingStatus | UPCOMING, ONGOING, COMPLETED, CANCELLED |
| purpose | String? | Reason for booking |
| cancelledAt | DateTime? | |
| createdAt | DateTime | Auto |

**Overlap constraint**: DB-level exclusion constraint using `tstzrange` + `btree_gist` ensures no two non-cancelled bookings for the same asset overlap.

### MaintenanceRequest
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| assetId | UUID | FK → Asset |
| requestedById | UUID | FK → User (who raised the request) |
| description | String | Issue description |
| priority | Priority | LOW, MEDIUM, HIGH, CRITICAL |
| status | MaintenanceStatus | PENDING, APPROVED, REJECTED, TECHNICIAN_ASSIGNED, IN_PROGRESS, RESOLVED |
| attachments | JSON | Array of file paths/URLs |
| technicianId | UUID? | FK → User (assigned technician) |
| approvedById | UUID? | FK → User (who approved/rejected) |
| resolvedAt | DateTime? | When resolved |
| createdAt | DateTime | Auto |

### AuditCycle
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | String | Cycle name/description |
| scopeType | ScopeType | DEPARTMENT / LOCATION |
| departmentId | UUID? | FK → Department (if scope is department) |
| location | String? | If scope is location |
| startDate | DateTime | Cycle start |
| endDate | DateTime | Cycle end |
| status | AuditCycleStatus | PLANNED, IN_PROGRESS, COMPLETED |
| createdById | UUID | FK → User (Admin who created it) |

### AuditItem
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| auditCycleId | UUID | FK → AuditCycle |
| assetId | UUID | FK → Asset |
| status | AuditItemStatus | PENDING, VERIFIED, MISSING, DAMAGED |
| notes | String? | Auditor notes |
| verifiedById | UUID? | FK → User (auditor) |
| verifiedAt | DateTime? | |

### Notification
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK → User (recipient) |
| type | NotificationType | ASSET_ASSIGNED, MAINTENANCE_APPROVED, MAINTENANCE_REJECTED, BOOKING_CONFIRMED, BOOKING_CANCELLED, BOOKING_REMINDER, TRANSFER_APPROVED, OVERDUE_RETURN, AUDIT_DISCREPANCY |
| title | String | Short title |
| message | String | Full message |
| isRead | Boolean | Default false |
| metadata | JSON | Additional data (entityId, entityType, etc.) |
| createdAt | DateTime | Auto |

### ActivityLog
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| userId | UUID | FK → User (who performed the action) |
| action | String | Action name (e.g., ASSET_CREATED, ALLOCATION_MADE, ROLE_PROMOTED) |
| entityType | String | Which entity was affected (Asset, User, Booking, etc.) |
| entityId | String | ID of the affected entity |
| details | JSON | Additional context (old values, new values, etc.) |
| createdAt | DateTime | Auto |

**Important**: No update/delete endpoints for ActivityLog — append-only.

## Enums

```
Role: EMPLOYEE, DEPARTMENT_HEAD, ASSET_MANAGER, ADMIN
UserStatus: ACTIVE, INACTIVE
DeptStatus: ACTIVE, INACTIVE
AssetStatus: AVAILABLE, ALLOCATED, RESERVED, UNDER_MAINTENANCE, LOST, RETIRED, DISPOSED
AllocationStatus: ACTIVE, RETURNED, TRANSFERRED
TransferStatus: REQUESTED, APPROVED, REJECTED, COMPLETED
BookingStatus: UPCOMING, ONGOING, COMPLETED, CANCELLED
MaintenanceStatus: PENDING, APPROVED, REJECTED, TECHNICIAN_ASSIGNED, IN_PROGRESS, RESOLVED
Priority: LOW, MEDIUM, HIGH, CRITICAL
AuditCycleStatus: PLANNED, IN_PROGRESS, COMPLETED
AuditItemStatus: PENDING, VERIFIED, MISSING, DAMAGED
ScopeType: DEPARTMENT, LOCATION
NotificationType: ASSET_ASSIGNED, MAINTENANCE_APPROVED, MAINTENANCE_REJECTED, BOOKING_CONFIRMED, BOOKING_CANCELLED, BOOKING_REMINDER, TRANSFER_APPROVED, OVERDUE_RETURN, AUDIT_DISCREPANCY
```

## Asset Status State Machine

```
Available ⇄ Under Maintenance
Available → Allocated → Available (via return)
Available → Reserved → Available (booking completes/cancelled)
Available/Allocated → Lost (via audit closure)
Available → Retired → Disposed
```

## Conflict Rules

### canAllocate(assetId)
- Reject if asset has an active Allocation (status=ACTIVE).
- Return current holder for "currently held by X" message + Transfer Request offer.
- Wrap in transaction with `SELECT ... FOR UPDATE`.

### hasOverlap(resourceId, startTime, endTime, excludingBookingId?)
- Reject if any non-cancelled booking overlaps `[startTime, endTime)`.
- Half-open interval: `existing.start < requested.end AND existing.end > requested.start`.
- DB exclusion constraint as second line of defense.
- Wrap in transaction with `SELECT ... FOR UPDATE`.
