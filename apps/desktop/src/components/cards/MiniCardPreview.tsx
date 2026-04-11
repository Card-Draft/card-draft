import { cn } from '../../lib/utils'
import {
  getArtCropValues,
  getDisplayName,
  getDisplayType,
  getMergedFieldValues,
  parseCardFields,
} from '../../lib/cardFields'
import { FRAME_COLORS, type FrameColor, frameColor } from '@card-draft/templates/magic-m15/logic'
import { RARITY_COLORS, RARITY_GRADIENTS } from '@card-draft/templates/magic-m15/logic'
import type { Card } from '@card-draft/core/types'
import type { M15Fields } from '@card-draft/templates/magic-m15/fields'

interface MiniCardPreviewProps {
  card: Pick<Card, 'fields'>
  index?: number
  className?: string
  compact?: boolean
  artOnly?: boolean
  rarityIconSrc?: string
}

export function MiniCardPreview({
  card,
  index,
  className,
  compact = false,
  artOnly = false,
  rarityIconSrc,
}: MiniCardPreviewProps) {
  const fields = getMergedFieldValues(parseCardFields(card.fields)) as unknown as M15Fields
  const name = getDisplayName(card.fields, index ? `Card ${index}` : 'Card')
  const typeLine = getDisplayType(card.fields)
  const artSrc = fields.art
  const { cropX, cropY, cropWidth, cropHeight } = getArtCropValues(fields)
  const color = frameColor(fields)
  const frameFill = FRAME_COLORS[color as FrameColor]
  const rarity = fields.rarity

  if (artOnly) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-[14px] bg-zinc-950 shadow-[0_14px_30px_rgba(0,0,0,0.28)]',
          compact ? 'aspect-[4/3]' : 'aspect-[4/3] w-full',
          className,
        )}
        style={{ border: `3px solid ${frameFill}` }}
      >
        {artSrc ? (
          <div
            className="absolute"
            style={{
              width: `${100 / cropWidth}%`,
              height: `${100 / cropHeight}%`,
              left: `${(-cropX / cropWidth) * 100}%`,
              top: `${(-cropY / cropHeight) * 100}%`,
            }}
          >
            <img
              src={artSrc}
              alt={name}
              className="block h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%),linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.22))] text-[10px] uppercase tracking-[0.22em] text-zinc-300/80">
            No Art
          </div>
        )}
        <HoverRarityIcon rarity={rarity} src={rarityIconSrc} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[12px] border border-zinc-700 bg-zinc-950 shadow-[0_14px_30px_rgba(0,0,0,0.28)]',
        compact ? 'aspect-[2.5/3.5]' : 'aspect-[2.5/3.5] w-full',
        className,
      )}
    >
      <div className="absolute inset-[5%] rounded-[10px] border border-black/25" style={{ backgroundColor: frameFill }} />

      <div className="absolute left-[9%] top-[7%] right-[9%] rounded-md bg-black/10 px-2 py-1">
        <div className="truncate text-[10px] font-semibold text-zinc-950">{name}</div>
      </div>

      <div className="absolute left-[9%] right-[9%] top-[17%] h-[44%] overflow-hidden rounded-md border border-black/20 bg-zinc-800">
        {artSrc ? (
          <div
            className="absolute"
            style={{
              width: `${100 / cropWidth}%`,
              height: `${100 / cropHeight}%`,
              left: `${(-cropX / cropWidth) * 100}%`,
              top: `${(-cropY / cropHeight) * 100}%`,
            }}
          >
            <img
              src={artSrc}
              alt={name}
              className="block h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%),linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.22))] text-[10px] uppercase tracking-[0.22em] text-zinc-300/80">
            No Art
          </div>
        )}
      </div>

      <div className="absolute left-[9%] right-[9%] top-[63%] rounded-md bg-black/10 px-2 py-1">
        <div className="truncate text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-900/80">
          {typeLine}
        </div>
      </div>

      <div className="absolute bottom-[9%] left-[9%] right-[9%] rounded-md border border-black/10 bg-[rgba(244,240,229,0.82)] px-2 py-1.5">
        <div className="line-clamp-3 text-[9px] leading-[1.25] text-zinc-700">
          {fields.rulesText || fields.flavorText || 'No rules text yet.'}
        </div>
      </div>
    </div>
  )
}

function HoverRarityIcon({ rarity, src }: { rarity: string | undefined; src: string | undefined }) {
  const gradientStops = RARITY_GRADIENTS[rarity ?? ''] ?? []
  const solidColor = rarity === 'common' ? '#000000' : (RARITY_COLORS[rarity ?? ''] ?? '#b0b0b0')
  const gradient =
    gradientStops.length >= 2
      ? `linear-gradient(135deg, ${gradientStops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(', ')})`
      : solidColor
  const isCommon = rarity === 'common'

  if (src) {
    return (
      <div className={`absolute bottom-2 right-2 h-7 w-7 rounded-full p-1 shadow-[0_8px_18px_rgba(0,0,0,0.4)] ${isCommon ? 'bg-white/90' : 'bg-zinc-950/75'}`}>
        <div
          className="h-full w-full"
          style={{
            background: gradient,
            WebkitMaskImage: `url("${src}")`,
            maskImage: `url("${src}")`,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={`absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-sm shadow-[0_8px_18px_rgba(0,0,0,0.4)] ${isCommon ? 'bg-white/90' : 'bg-zinc-950/75'}`}
      style={{ color: solidColor }}
    >
      ◆
    </div>
  )
}
