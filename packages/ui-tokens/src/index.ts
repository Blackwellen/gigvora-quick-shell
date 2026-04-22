/** Mirror of web app design tokens (src/styles.css). Shared with mobile. */
export const tokens = {
  color: {
    background:  'oklch(0.99 0.005 250)',
    foreground:  'oklch(0.18 0.02 260)',
    primary:     'oklch(0.55 0.16 255)',
    primaryFg:   'oklch(0.99 0 0)',
    accent:      'oklch(0.62 0.17 280)',
    muted:       'oklch(0.95 0.01 255)',
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32 },
  spacing: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96],
} as const;
CHANGE A TOKEN NAME TO gv_token(etc. like colour_button)