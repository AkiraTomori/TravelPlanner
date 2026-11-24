# Contract — `POST /plans/{planId}/save`

Status: v1, PA#2. Tests: `tests/contract/save-plan.test.ts`.

## Purpose

Save is step 6 of the planner flow: the plan's creator has reviewed the schedule and the spending
and presses **Save**. Only then does the schedule become visible to the rest of the group. Before
saving, the backend runs the validator one last time; a plan the validator rejects is never shared.

The request is **safe to repeat**: retrying it (same or new `Idempotency-Key`) never shares the plan
twice and never notifies the group twice.

## Who may call it

| Caller                                               | Result                                       |
| ---------------------------------------------------- | -------------------------------------------- |
| No or invalid bearer token                           | `401` `unauthenticated`                      |
| Signed in, **not a member** of the plan's group      | `404` `plan-not-found` (existence is hidden) |
| Signed in, member of the group, **not the creator**  | `403` `not-plan-owner`                       |
| Signed in, the plan's **creator** (`plan.createdBy`) | allowed                                      |

Role: any signed-in user. Ownership rule: the plan belongs to the user in `plan.createdBy`; only that
user may save it. Other members of the same group can read the saved plan but cannot save it. A
user outside the group is told the plan does not exist, so plan ids cannot be probed.

A plan with no group (individual budget) has a group of one: its creator.

## Request

```
POST /plans/{planId}/save
Authorization: Bearer <token>
Content-Type: application/json
Idempotency-Key: <key>
```

| Part              | Rule                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------- |
| `planId` (path)   | String, 1–64 chars, `[A-Za-z0-9_-]`. Anything else is `404 plan-not-found`.           |
| `Authorization`   | Required. `Bearer` + the session token.                                               |
| `Content-Type`    | Required, `application/json`. Anything else is `415 unsupported-media-type`.          |
| `Idempotency-Key` | Required. 8–128 chars, `[A-Za-z0-9_-]` (a UUID v4 is recommended). Kept for 24 hours. |

Body (JSON object, no other fields allowed):

| Field             | Type    | Rule                                                                                   |
| ----------------- | ------- | -------------------------------------------------------------------------------------- |
| `expectedVersion` | integer | Required, ≥ 1. The `version` the client last read. Guards against saving over an edit. |

```json
{ "expectedVersion": 3 }
```

## Response — `200 OK`

`Content-Type: application/json`. The same status is used for the first save and for every repeat.

| Field                     | Type            | Rule                                                                      |
| ------------------------- | --------------- | ------------------------------------------------------------------------- |
| `planId`                  | string          | The path id.                                                              |
| `groupId`                 | string          | The group that can now see the plan.                                      |
| `status`                  | `"saved"`       | Always `"saved"` on 200.                                                  |
| `version`                 | integer         | The saved version (equals `expectedVersion`).                             |
| `savedAt`                 | string          | RFC 3339 UTC timestamp of the **first** save of this version.             |
| `savedBy`                 | string          | User id of the creator.                                                   |
| `sharedNow`               | boolean         | `true` only on the request that shared the plan; `false` on every repeat. |
| `cost.totalVnd`           | integer         | Sum of all members' spending, VND, computed by code.                      |
| `cost.groupTotalVnd`      | integer \| null | The group total, or `null` for an individual plan.                        |
| `cost.members[]`          | array           | One entry per group member, ordered by `userId`.                          |
| `cost.members[].userId`   | string          | Member id (never a name or e-mail).                                       |
| `cost.members[].spendVnd` | integer         | That member's spending in this plan.                                      |
| `cost.members[].capVnd`   | integer \| null | That member's personal cap, `null` if none.                               |

Headers: `Idempotent-Replayed: true` when the body is a stored response replayed for a repeated
`Idempotency-Key` (absent otherwise).

```json
{
  "planId": "plan_weekend",
  "groupId": "grp_linh",
  "status": "saved",
  "version": 3,
  "savedAt": "2026-11-28T02:00:00.000Z",
  "savedBy": "usr_linh",
  "sharedNow": true,
  "cost": {
    "totalVnd": 1460000,
    "groupTotalVnd": 4000000,
    "members": [
      { "userId": "usr_an", "spendVnd": 365000, "capVnd": 1000000 },
      { "userId": "usr_bao", "spendVnd": 365000, "capVnd": null },
      { "userId": "usr_linh", "spendVnd": 365000, "capVnd": 1000000 },
      { "userId": "usr_minh", "spendVnd": 365000, "capVnd": null }
    ]
  }
}
```

## Errors

Every error is `application/problem+json` (RFC 9457) with `type`, `title`, `status` and `detail`.
`type` is a relative URI under `/problems/`; clients branch on `type`, never on `title` or `detail`.

| Status | `type`                               | When                                                                                         | Extra members                  |
| ------ | ------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------ |
| 400    | `/problems/invalid-request`          | Body is not a JSON object, `expectedVersion` missing / not an integer ≥ 1, or unknown fields | `errors: [{ field, message }]` |
| 400    | `/problems/idempotency-key-required` | `Idempotency-Key` header missing or not 8–128 chars of `[A-Za-z0-9_-]`                       | —                              |
| 401    | `/problems/unauthenticated`          | No `Authorization` header, not `Bearer`, or unknown token                                    | —                              |
| 403    | `/problems/not-plan-owner`           | Caller is a member of the group but not `plan.createdBy`                                     | —                              |
| 404    | `/problems/plan-not-found`           | No such plan, malformed `planId`, or caller is not a member of the plan's group              | —                              |
| 409    | `/problems/version-conflict`         | `expectedVersion` ≠ the plan's current version (someone edited it after the client read it)  | `currentVersion: integer`      |
| 415    | `/problems/unsupported-media-type`   | `Content-Type` is not `application/json`                                                     | —                              |
| 422    | `/problems/plan-invalid`             | The validator rejects the plan. Nothing is saved or shared.                                  | `violations: [Violation]`      |
| 422    | `/problems/idempotency-key-reused`   | Same `Idempotency-Key` sent earlier by this user with a different `planId` or body           | —                              |
| 500    | `/problems/internal`                 | Unexpected failure. Nothing is shared. Safe to retry with the same key.                      | —                              |

Checks run in this order, and the first failure is returned: `415` → `401` → `400 idempotency-key-required`
→ idempotency replay / `422 idempotency-key-reused` → `400 invalid-request` → `404` → `403` → `409` → `422 plan-invalid`.

`Violation`:

| Field       | Type            | Rule                                                                                         |
| ----------- | --------------- | -------------------------------------------------------------------------------------------- |
| `code`      | string          | One of `unknown-place`, `unknown-item`, `over-member-cap`, `over-group-total`, `stop-order`. |
| `stopIndex` | integer \| null | 0-based index of the stop at fault, `null` for whole-plan violations.                        |
| `userId`    | string \| null  | Member at fault for `over-member-cap`, else `null`.                                          |
| `message`   | string          | Human-readable, for display only.                                                            |

PA#3 adds `closed-at-time`, `travel-time-too-short` and `rain-outdoor` (opening hours, travel matrix and
forecast arrive with the shared data). Clients must treat an unknown `code` as a generic violation.

```json
{
  "type": "/problems/plan-invalid",
  "title": "The plan does not pass validation",
  "status": 422,
  "detail": "1 violation; the plan was not saved.",
  "violations": [
    {
      "code": "over-member-cap",
      "stopIndex": null,
      "userId": "usr_an",
      "message": "Spending 1,150,000 VND is over the cap of 1,000,000 VND."
    }
  ]
}
```

## Idempotency

- Scope: `(caller userId, Idempotency-Key)`. Keys from different users never collide.
- Same key, same `planId` and a **byte-identical** body within 24 h → the stored response is returned unchanged
  (same status, same body, including `sharedNow`), with header `Idempotent-Replayed: true`.
  Nothing is validated, saved or notified again.
- Same key, different `planId` or a body that differs in any byte (including key order or
  whitespace) → `422 idempotency-key-reused`. Clients must resend the exact bytes they sent first.
- Only `200` responses are stored. An error is not stored, so after fixing the cause the client may
  retry with the same key.
- A **new** key on a plan already saved at `expectedVersion` → `200` with `sharedNow: false` and the
  original `savedAt`. The group is not notified again. This is what makes Save safe to repeat even
  when a client loses its key.

## Paging

Not applicable: the endpoint acts on one plan and returns one object.

## What changes when it succeeds

- On the first successful save of a version: `plan.status` becomes `saved`, `savedAt` and `savedBy`
  are set, and **one** `plan-shared` notification is sent to each other member of the group.
- On a repeat: nothing changes and nothing is sent.
- On any error: nothing changes and nothing is sent.
- Editing a saved plan (a separate endpoint) creates version `n+1` in `draft`; the group keeps seeing
  version `n` until version `n+1` is saved.

## When this contract changes

- Additive changes (a new optional response field, a new `Violation.code`) are not breaking; clients
  must ignore unknown fields and codes.
- Anything else (a renamed field, a new required request field, a status change) is breaking: it is
  written here first, in the same PR as the code and the tests, and called out in the PR title.
- `tests/contract/save-plan.test.ts` holds the code to this file; a PR that changes behaviour without
  changing this file fails review.
