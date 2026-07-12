---
name: rbac-workflow
description: Role-Based Access Control workflow — defines the 4 roles (Employee, Department Head, Asset Manager, Admin), their permissions per endpoint, and the promotion flow rules.
---

# RBAC Workflow

## Roles

| Role | Level | Scope |
|---|---|---|
| Employee | 1 | Own data only |
| Department Head | 2 | Own department's data |
| Asset Manager | 3 | All assets, cross-department |
| Admin | 4 | Everything |

## Promotion Rules
1. New signups are ALWAYS Employee. The signup endpoint MUST strip/ignore any `role` field.
2. Only Admin can promote users (Employee → Dept Head, Employee → Asset Manager).
3. Promotion happens ONLY via `PATCH /users/:id/role` on the Employee Directory (Screen 3, Tab C).
4. Every promotion MUST write an ActivityLog entry with: who promoted, who was promoted, old role, new role.
5. Demotion follows the same rules (Admin only, ActivityLog entry).

## Permission Matrix

| Endpoint | Employee | Dept Head | Asset Manager | Admin |
|---|---|---|---|---|
| View own assets | ✅ | ✅ | ✅ | ✅ |
| View department assets | ❌ | ✅ (own dept) | ✅ (all) | ✅ |
| Register asset | ❌ | ❌ | ✅ | ✅ |
| Allocate asset | ❌ | ✅ (own dept) | ✅ | ✅ |
| Approve transfer | ❌ | ✅ (own dept) | ✅ | ✅ |
| Book resource | ✅ | ✅ | ✅ | ✅ |
| Raise maintenance | ✅ | ✅ | ✅ | ✅ |
| Approve maintenance | ❌ | ❌ | ✅ | ✅ |
| Manage departments | ❌ | ❌ | ❌ | ✅ |
| Manage categories | ❌ | ❌ | ❌ | ✅ |
| Manage users/roles | ❌ | ❌ | ❌ | ✅ |
| Create audit cycle | ❌ | ❌ | ❌ | ✅ |
| Verify audit items | ❌ | ❌ | ✅ (assigned) | ✅ |
| View reports | ❌ | ✅ (own dept) | ✅ | ✅ |

## Implementation
1. Use NestJS `@Roles()` custom decorator + `RolesGuard`.
2. The guard reads the user's role from the JWT-verified userId → DB lookup (not from token payload directly for role, as role can change between token issuance and request).
3. For department-scoped access, use `DepartmentGuard` that checks `user.departmentId` matches the resource's department.
4. Apply guards at the controller level, not at the service level — services assume authorization is already checked.
