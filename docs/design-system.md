# Design System

All styles live in `src/app/globals.css`. Two root layouts (`[locale]` and
`staff`) both import it. The palette and tokens are derived from
`public/logo.jpeg`:

- `--color-green-900` through `--color-green-600` — brand greens
- `--color-cream-50` through `--color-cream-300` — backgrounds/surfaces
- `--font-display: Georgia` (serif, for headings), `--font-body: Geist`

Classes are hand-written, BEM-ish (`.site-header__brand`, `.item-row__title`,
`.btn--primary`, `.status-pill--on_its_way`). Use existing classes before
inventing new ones. Inline `style={{}}` is fine for one-offs.
