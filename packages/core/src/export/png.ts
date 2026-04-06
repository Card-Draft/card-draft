/**
 * PNG export helpers.
 *
 * The actual canvas capture happens in the renderer via Konva's
 * `stage.toDataURL({ pixelRatio })`. This module provides the
 * resolution constants and helpers shared between renderer and main.
 */

export const CARD_WIDTH_PX = 744 // logical canvas width
export const CARD_HEIGHT_PX = 1039 // logical canvas height

export type ExportPreset = 'screen' | 'print300' | 'print600' | 'mpc'

export interface ExportResolution {
  pixelRatio: number
  outputWidth: number
  outputHeight: number
  dpi: number
  label: string
}

export const EXPORT_PRESETS: Record<ExportPreset, ExportResolution> = {
  screen: {
    pixelRatio: 1,
    outputWidth: 744,
    outputHeight: 1039,
    dpi: 96,
    label: 'Screen Preview (96 DPI)',
  },
  print300: {
    pixelRatio: 3.125,
    outputWidth: 2325,
    outputHeight: 3247,
    dpi: 300,
    label: 'Print Standard (300 DPI)',
  },
  print600: {
    pixelRatio: 6.25,
    outputWidth: 4650,
    outputHeight: 6494,
    dpi: 600,
    label: 'Print Premium (600 DPI)',
  },
  mpc: {
    // MakePlayingCards spec: 822×1122 at 300 DPI with bleed
    pixelRatio: 1.104,
    outputWidth: 822,
    outputHeight: 1122,
    dpi: 300,
    label: 'MPC Ready (822×1122 @ 300 DPI)',
  },
}
