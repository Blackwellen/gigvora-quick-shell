# Vol 4 — WebRTC, Realtime Chat, Back Buttons, Dead Clicks

> Companion to `Gigvora-Master-Audit-Vol4.docx`. Verified counts on 2026-04-22.

## Headline forensic counts

| Signal | Value | Where |
|---|---|---|
| `RTCPeerConnection` instances | **0** | No native WebRTC anywhere |
| `getUserMedia` calls | 1 | `src/components/voice/VoiceNoteRecorder.tsx:30` |
| ICE / TURN / STUN config | **0** | None — blocker for native WebRTC |
| Supabase Realtime channels in `src/` | **0** | No realtime chat |
| Jitsi mounts (frontend) | 1 | `src/components/voice/JitsiRoom.tsx` (public meet.jit.si) |
| `pickVideoProvider` (backend) | 1 | `apps/api-nest/.../networking-events-groups.service.ts:216` — **frontend ignores it** |
| `<Route>` count in App.tsx | 640 | Largest SPA |
| Pages without DashboardLayout | 75 | Orphan routes |
| Dead `onClick` (toast/alert/console only) | **348** | CI-block |

## Root-cause finding (back buttons)

`src/components/shell/DashboardLayout.tsx` does **not** render `<AutoBackNav />`. 339 pages import this layout. Adding one line at the top of the return restores back navigation across the whole app.

## WebRTC plan summary (Sessions 16–17)

- Session 16 — Jitsi hardened: provider router on client, signed JWT, telemetry, PreJoinCard, BrowserSupportGate, PostCallSummary, mute-on-join policy.
- Session 17 — LiveKit room + ICE/TURN (Twilio NTS or Cloudflare TURN) + recording egress to Supabase Storage + group cap + network quality badge.

## Realtime chat plan summary (Sessions 7–8)

Channels: `thread:{id}`, `presence:user:{id}`, `inbox:{userId}`, `org:{id}:notifications`, `call:{id}:signaling`.
Hooks: `useThreadMessages`, `useThreadList`, `useTyping`, `usePresence`, `useUnreadDigest`, `useReadReceipt`.
Performance budgets: first 50 msgs <300ms cold, send round-trip <500ms p95, typing <250ms p95.

## CI guard for dead clicks

```bash
BAD=$(grep -rEn 'onClick=\{?\(?\) ?=> ?(toast|alert|console)' src/pages | wc -l)
[ "$BAD" -gt 0 ] && exit 1
```

## See DOCX for

- §1 WebRTC capability gap matrix (18 capabilities) + state machine + new components
- §2 Realtime topology table + hook list + RLS rules + perf budgets
- §3 Shell coverage matrix + exact `DashboardLayout.tsx` patch
- §4 Dead-click triage matrix
- §5 Sessions 1–24 execution plan
