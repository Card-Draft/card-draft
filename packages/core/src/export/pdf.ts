/**
 * PDF print sheet assembly using pdf-lib.
 * Called from the renderer process (pdf-lib is browser-safe).
 */

import { PDFDocument, rgb } from 'pdf-lib'

export type PageSize = 'Letter' | 'A4' | 'A3'

const PAGE_SIZES: Record<PageSize, [number, number]> = {
  Letter: [612, 792],   // 8.5" × 11" at 72 DPI
  A4: [595.28, 841.89],
  A3: [841.89, 1190.55],
}

export interface PrintSheetOptions {
  /** base64 PNG data URLs for each card */
  cardDataUrls: string[]
  cardsPerRow: number
  cardsPerColumn: number
  /** bleed in inches (adds to each card's printed size) */
  bleedInches: number
  pageSize: PageSize
}

export async function buildPrintSheet(options: PrintSheetOptions): Promise<Uint8Array> {
  const {
    cardDataUrls,
    cardsPerRow,
    cardsPerColumn,
    bleedInches,
    pageSize,
  } = options

  const [pageW, pageH] = PAGE_SIZES[pageSize]!
  const pdfDoc = await PDFDocument.create()

  // Card physical dimensions at 72 DPI (pdf-lib uses points = 1/72 inch)
  const cardW = (2.5 + bleedInches * 2) * 72
  const cardH = (3.5 + bleedInches * 2) * 72
  const bleedPts = bleedInches * 72

  const marginX = (pageW - cardsPerRow * cardW) / 2
  const marginY = (pageH - cardsPerColumn * cardH) / 2

  let page = pdfDoc.addPage([pageW, pageH])

  let col = 0
  let row = 0

  for (let idx = 0; idx < cardDataUrls.length; idx++) {
    const dataUrl = cardDataUrls[idx]
    if (!dataUrl) continue

    // New page when grid is full
    if (col === 0 && row === 0 && idx > 0) {
      page = pdfDoc.addPage([pageW, pageH])
    }

    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
    const pngBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    const pngImage = await pdfDoc.embedPng(pngBytes)

    const x = marginX + col * cardW
    // pdf-lib y=0 is bottom; flip to top-down
    const y = pageH - marginY - (row + 1) * cardH

    page.drawImage(pngImage, { x, y, width: cardW, height: cardH })

    // Draw crop marks at bleed boundary
    drawCropMark(page, x + bleedPts, y + bleedPts, x + cardW - bleedPts, y + cardH - bleedPts)

    col++
    if (col >= cardsPerRow) {
      col = 0
      row++
      if (row >= cardsPerColumn) {
        col = 0
        row = 0
      }
    }
  }

  return pdfDoc.save()
}

function drawCropMark(
  page: ReturnType<PDFDocument['addPage']>,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const len = 8 // crop mark length in points
  const color = rgb(0, 0, 0)
  const thickness = 0.25

  // Top-left
  page.drawLine({ start: { x: x1 - len, y: y2 }, end: { x: x1, y: y2 }, color, thickness })
  page.drawLine({ start: { x: x1, y: y2 + len }, end: { x: x1, y: y2 }, color, thickness })
  // Top-right
  page.drawLine({ start: { x: x2, y: y2 }, end: { x: x2 + len, y: y2 }, color, thickness })
  page.drawLine({ start: { x: x2, y: y2 + len }, end: { x: x2, y: y2 }, color, thickness })
  // Bottom-left
  page.drawLine({ start: { x: x1 - len, y: y1 }, end: { x: x1, y: y1 }, color, thickness })
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x1, y: y1 - len }, color, thickness })
  // Bottom-right
  page.drawLine({ start: { x: x2, y: y1 }, end: { x: x2 + len, y: y1 }, color, thickness })
  page.drawLine({ start: { x: x2, y: y1 }, end: { x: x2, y: y1 - len }, color, thickness })
}
