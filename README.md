# Dead Reckoning

> Navigate pivotal moments in history armed only with the information available at the time.

A browser-based historical decision game for high school students. Players take on period roles, examine authentic-feeling documents under time pressure, and make decisions with only the information available at the moment — then face the debrief.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** — period-accurate visual design, no 3D
- **Zustand** — client-side game state
- **Sanity.io** — scenario and document CMS (Phase 2)
- **PostgreSQL** — player sessions, analytics (Phase 5)

## Project Structure

```
app/
  game/           # Main game route (KAR-8: Desk UI)
  components/
    desk/         # 4-panel desk shell components
    documents/    # Telegram, Newspaper, Letter, Map components
    ui/           # Shared UI primitives
  store/          # Zustand game store
  types/          # TypeScript interfaces
  scenarios/      # Local scenario data (pre-CMS)
  lib/            # Utilities
```

## Phases

| Phase | Tasks | Description |
|-------|-------|-------------|
| P1 | KAR-7 to KAR-10 | Scaffolding + core document components |
| P2 | KAR-11 to KAR-14 | Full document system |
| P3 | KAR-15 to KAR-16 | Decision engine |
| P4 | KAR-17 to KAR-18 | Scenario content (July Crisis 1914) |
| P5 | KAR-19 to KAR-20 | Debrief system |
| P6 | KAR-21 to KAR-22 | Auth + teacher dashboard |
| P7 | KAR-23 to KAR-24 | Polish + pilot |

## Dev

```bash
npm run dev    # localhost:3000
npm run build  # production build check
```
