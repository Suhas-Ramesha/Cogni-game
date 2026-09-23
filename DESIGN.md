# CogniGame NER — Design system

Agents: treat this file as visual source of truth. Product identity (NER forest / turmeric / cream) overrides generic skill palettes. Do not introduce purple-AI gradients, neon, or emoji-as-icons.

**Inspiration sources used**

- UI/UX Pro Max: healthcare + Atkinson Hyperlegible; avoid neon; 44px+ targets; `prefers-reduced-motion`
- Contemporary: bento layout, sidebar dashboard, consistent tokens (not the magenta palette)
- Friendly: generous radius, approachable density for older caregivers
- 21st.dev (public catalog, MCP not connected in this environment): collapsible sidebar, health stat cards, dashboard shell, live badge
- Web Interface Guidelines: focus-visible, skip link, `text-wrap: balance`, tabular nums, no `transition: all`
- Taste (coherence, not hyperpop): one look, one accent per surface, gold/turmeric only on CTAs

## Atmosphere

A quiet clinic overlooking a tea garden. Paper-cream canvas, Assam-green structure, turmeric only when something needs action. Professional enough for a health worker at a PHC; warm enough that a family caregiver is not intimidated.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--forest` | `#0F3D2E` | Sidebar, primary text on cream, headers |
| `--canopy` | `#1F6F4A` | Success, live pulse, chart |
| `--turmeric` | `#E0A100` | Primary CTA only |
| `--ink` | `#14110F` | Body text |
| `--bark` | `#5C4A3A` | Secondary text |
| `--cream` | `#F4EDE1` | Page background |
| `--paper` | `#FFFBFA` | Cards |
| `--mist` | `#E4EDE6` | Hairlines, chips |
| `--alert` | `#9B1D20` | Critical only |
| `--warn` | `#B45309` | Missed / warning |

Radius: 12 / 20 / 28. Shadow: `0 1px 0 rgba(15,61,46,0.04), 0 18px 40px -24px rgba(15,61,46,0.35)`.

**Type**

- Display: **Fraunces** (soft serif, 600–700)
- UI: **Atkinson Hyperlegible** (400/700) — healthcare readability
- Tabular numbers on scores, times, pairing codes

**Motion**

- 160ms opacity + translateY only
- Stagger cards 40ms
- Disable under `prefers-reduced-motion`

**Do**

- Lucide SVG icons, labelled
- Sidebar + main for dashboard (21st.dev shell)
- Bento patient cards with live-sync, language chip, sparkline
- Visible `:focus-visible` turmeric ring
- Empty / loading / error states

**Don't**

- Neumorphic low-contrast grey-on-grey (skill suggested it; a11y veto)
- Color-only meaning
- Hamburger-only IA on desktop
- Inter / Geist / purple as the brand
