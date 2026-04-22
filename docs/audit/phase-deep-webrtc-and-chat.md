# Deep-Dive Audit — WebRTC, Realtime Chat, Back-Button, Drawer-vs-Page

> Companion to `Gigvora-Enterprise-Audit.docx`. Ground truth from the codebase as of 2026-04-22.

## 0. Verified findings

| Finding | Evidence |
|---|---|
| **WebRTC = 0 implementation** | `grep -rE "RTCPeerConnection\|getUserMedia\|new MediaStream\|RTCSessionDescription" src` returns 1 match — and only as a comment string. No peer connections, no signaling, no TURN, no ICE handling exists. |
| **Realtime = 0 supabase.channel calls** | `src/lib/realtime/socket.ts` is a stub adapter that points at a non-existent `/realtime` socket.io endpoint via dynamic import that fails silently. Every "live" surface (inbox, presence, notifications, dispute timeline, room participants, calls) silently no-ops. |
| **`AutoBackNav` exists but is mounted in only 2 of 7 shells** | `grep -rl "AutoBackNav" src` → only `DashboardShell.tsx` and `PublicShell.tsx`. The other 5 shells (`LoggedInShell`, `AdminShell`, `AdminIsolationGuard`, `LaunchpadShell`, `LegalPageShell`) leave ~400 routes with no automatic back path. |
| **109 files use `<Sheet />` / `<Drawer />`** | Versus only 25 detail-route patterns. Confirms drawer over-use. |
| **Admin gate is `localStorage` password** | `src/lib/adminAuth.tsx` — critical privilege-escalation risk. |

## 1. WebRTC plan — see DOCX §1 (full architecture, tables, edge functions, failure modes, mobile parity)

## 2. Realtime chat plan — see DOCX §2 (schema, channels, composer rules)

## 3. Back-button shell coverage

| Shell | Mounts AutoBackNav? | Affected routes | Action |
|---|---|---|---|
| `DashboardShell` | ✅ | ~80 | OK |
| `PublicShell` | ✅ | ~30 | OK |
| `LoggedInShell` | ❌ | ~250 | **MOUNT IT** |
| `AdminShell` | ❌ | ~90 | **MOUNT IT** |
| `AdminIsolationGuard` | ❌ | super/internal | **MOUNT IT** |
| `LaunchpadShell` | ❌ | ~25 | **MOUNT IT** |
| `LegalPageShell` | ❌ | ~10 | **MOUNT IT** (breadcrumb-only mode acceptable) |

Add these missing breadcrumb labels to `SEGMENT_LABELS` in `AutoBackNav.tsx`:
`enterprise-connect, recruiter-pro, navigator, mediastack, webinars, groups, mentorship, internal, cs, moderation, marketing, ops, super, org, workspaces, help, signin, signup, forgot-password, reset-password, verify-email, account-locked`.

## 4. Drawer-vs-page conversion list — see DOCX §4 (~25 to convert, ~16 to keep)

## 5. Internal portals sub-page CRUD/RLS map — see DOCX §5

## 6. Dead-end scan — see DOCX §6

## 7. Final 24-session build order — see DOCX §7

---

## Critical fixes that must precede any further feature work

1. **Replace `src/lib/adminAuth.tsx`** with Supabase auth + `has_role(uid, 'admin')`. This is the single highest-risk item in the entire codebase.
2. **Extend the `app_role` enum** from `(admin, moderator, user)` to the 14-role family the product needs (`user, professional, business, enterprise, admin, super_admin, customer_service, finance, disputes, moderator, marketing, verification, trust_safety, ops`).
3. **Mount `AutoBackNav`** in the 5 missing shells.
4. **Replace `src/lib/realtime/socket.ts`** with a Supabase Realtime adapter so inbox/notifications/presence stop silently no-op'ing.
5. **Enable Supabase Realtime publication** for `notifications`, `messages`, `thread_participants`, `dispute_events`, `calls`, `call_participants`, `room_participants`, `posts`, `comments`, `reactions`.
