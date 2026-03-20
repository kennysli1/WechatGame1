import { TextStyle } from 'pixi.js';

// ── Color Palette (aligned with docs/ART_STYLE_GUIDE.md) ─────────────────────

export const Colors = {
  grassGreen:  0x2d8a4e,
  deepBlue:    0x16213e,
  actionRed:   0xe63946,
  gold:        0xffd700,
  teal:        0x2a9d8f,
  warmYellow:  0xe9c46a,
  midBlue:     0x457b9d,

  bgDark:      0x1a1a2e,
  bgDarker:    0x0d1b2a,
  headerBg:    0x0a1628,

  textPrimary: 0xf8f9fa,
  textSecondary: 0xadb5bd,
  textMuted:   0x888888,
  textDim:     0x666666,

  outline:     0x000000,
  white:       0xffffff,
  black:       0x000000,

  btnPrimary:      0x2d6a4f,
  btnPrimaryHover: 0x40916c,
  btnSecondary:      0x1d3557,
  btnSecondaryHover: 0x2a4d7a,
  btnDanger:       0x6d3b47,
  btnDangerHover:  0x8b4d5e,
  btnNeutral:      0x495057,
  btnNeutralHover: 0x6c757d,

  success:   0x40916c,
  warning:   0xffd93d,
  error:     0xff6b6b,

  cardGK:  0xe9c46a,
  cardDEF: 0x2a9d8f,
  cardMID: 0x457b9d,
  cardFWD: 0xe63946,

  divider: 0x3a5a7a,
} as const;

// ── Font Stacks ──────────────────────────────────────────────────────────────

export const Fonts = {
  primary: 'Arial, "Microsoft YaHei", sans-serif',
  mono:    '"Courier New", monospace',
} as const;

// ── Art Style Guide Constants ────────────────────────────────────────────────

export const OUTLINE_WIDTH    = 2.5;
export const BORDER_RADIUS    = 12;
export const BORDER_RADIUS_SM = 8;
export const BORDER_RADIUS_LG = 16;

// ── Text Style Factory ──────────────────────────────────────────────────────

export interface TextStylePreset {
  fontSize?: number;
  fill?: number;
  fontWeight?: 'normal' | 'bold';
  dropShadow?: boolean;
  align?: 'left' | 'center' | 'right';
  wordWrap?: boolean;
  wordWrapWidth?: number;
}

export function makeTextStyle(opts: TextStylePreset = {}): TextStyle {
  const style: ConstructorParameters<typeof TextStyle>[0] = {
    fontFamily: Fonts.primary,
    fontSize:   opts.fontSize ?? 16,
    fontWeight: opts.fontWeight ?? 'normal',
    fill:       opts.fill ?? Colors.textPrimary,
    align:      opts.align,
  };

  if (opts.dropShadow) {
    style.dropShadow = {
      color:    Colors.black,
      blur:     6,
      distance: 3,
      angle:    Math.PI / 4,
    };
  }

  if (opts.wordWrap && opts.wordWrapWidth) {
    style.wordWrap = true;
    style.wordWrapWidth = opts.wordWrapWidth;
  }

  return new TextStyle(style);
}

// ── Preset Styles ─────────────────────────────────────────────────────────────

export const TextStyles = {
  title:    () => makeTextStyle({ fontSize: 48, fontWeight: 'bold', dropShadow: true }),
  heading:  () => makeTextStyle({ fontSize: 36, fontWeight: 'bold', dropShadow: true }),
  subheading: () => makeTextStyle({ fontSize: 24, fontWeight: 'bold' }),
  body:     () => makeTextStyle({ fontSize: 18 }),
  caption:  () => makeTextStyle({ fontSize: 14, fill: Colors.textSecondary }),
  small:    () => makeTextStyle({ fontSize: 11, fill: Colors.textMuted }),
  button:   (size = 20) => makeTextStyle({ fontSize: size, fontWeight: 'bold' }),
  score:    () => makeTextStyle({ fontSize: 28, fontWeight: 'bold' }),
  gold:     (size = 20) => makeTextStyle({ fontSize: size, fontWeight: 'bold', fill: Colors.gold }),
  error:    (size = 14) => makeTextStyle({ fontSize: size, fill: Colors.error }),
  success:  (size = 14) => makeTextStyle({ fontSize: size, fill: Colors.success }),
} as const;
