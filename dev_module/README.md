# Development Modules — Constellation Gallery

## Module Index

| # | Module | Est. Days | Depends On | Priority |
|---|---|---|---|---|
| **00** | [Project Scaffold & Toolchain](./00_project_scaffold.md) | 1 | — | P0 |
| **01** | [Data Pipeline & API Layer](./01_data_pipeline.md) | 3 | 00 | P0 |
| **02** | [State Management & URL Sync](./02_state_management.md) | 1.5 | 00 | P0 |
| **03** | [Cosmic Timeline (3D)](./03_cosmic_timeline.md) | 4 | 01, 02 | P0 |
| **04** | [Artist Profile (2D Overlay)](./04_artist_profile.md) | 2 | 01, 02, 03 | P0 |
| **05** | [Gallery Environment (3D)](./05_gallery_environment.md) | 5 | 01, 02 | P0 |
| **06** | [Transition System & Dual Canvas](./06_transition_system.md) | 2 | 03, 04, 05 | P0 |
| **07** | [Texture Management](./07_texture_management.md) | 2 | 01, 05 | P1 |
| **08** | [Audio System](./08_audio_system.md) | 2 | 02, 06 | P1 |
| **09** | [Mobile Support](./09_mobile_support.md) | 2.5 | 03, 05, 06 | P1 |
| **10** | [Accessibility & Performance](./10_accessibility_performance.md) | 2 | 06, 07 | P1 |
| **11** | [Testing & QA](./11_testing_qa.md) | 2 | 01–10 | P2 |

**Total Estimate:** ~29 days

## Execution Order

```
Phase 1 (Foundation)          Phase 2 (Core Features)         Phase 3 (Polish)
─────────────────────        ────────────────────────        ─────────────────
00 ──► 01 ──► 03 ──► 04               05 ──► 06              07  08  09
  │                │                   │                      │   │   │
  └──► 02 ────────┘                   └──────────────────────┘   │   │
                                                                  │   │
                                                                  └─► 10
                                                                       │
                                                                       └─► 11
```

Modules 01 and 02 can run in parallel after 00.
Modules 03 and 05 can run in parallel after 01 and 02.
Modules 07, 08, 09 can run in parallel after 06.