import { useState } from 'react'
import { getMagicM15DomAssetsPath } from '../../lib/templateAssets'
import { tokenizeCanonicalManaCost } from '../../lib/manaCost'
import {
  buildManaSymbolAssetPath,
  getManaFontClassName,
  isManaCostSymbol,
  resolveManaFontGlyphs,
} from '@card-draft/template-runtime'

function ManaSymbolFallback({ symbol }: { symbol: string }) {
  return (
    <span className="inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full border border-zinc-600 px-1 text-[9px] font-semibold leading-none text-zinc-300">
      {symbol}
    </span>
  )
}

export function ManaCostInline({ cost }: { cost: string }) {
  const tokens = tokenizeCanonicalManaCost(cost)

  if (tokens.length === 0) {
    return <span className="font-mono text-xs text-zinc-500">—</span>
  }

  return (
    <span className="flex items-center justify-end gap-0.5">
      {tokens.map((token, index) => {
        if (token.kind === 'text') {
          return (
            <span key={`${token.kind}-${index}`} className="font-mono text-xs text-zinc-400">
              {token.value}
            </span>
          )
        }

        return (
          <InlineManaSymbol
            key={`${token.kind}-${token.value}-${index}`}
            symbol={token.value}
          />
        )
      })}
    </span>
  )
}

function InlineManaSymbol({
  symbol,
}: {
  symbol: string
}) {
  const className = getManaFontClassName(symbol)
  const glyphs = resolveManaFontGlyphs(symbol)

  if (className && glyphs) {
    return (
      <span
        aria-label={`{${symbol}}`}
        className={`ms ${isManaCostSymbol(symbol) ? 'ms-cost' : ''} ms-${className} text-[15px] leading-none`}
        title={`{${symbol}}`}
      />
    )
  }

  return (
    <InlineManaImageFallback
      symbol={symbol}
      src={buildManaSymbolAssetPath(`${getMagicM15DomAssetsPath()}/symbols`, symbol)}
    />
  )
}

function InlineManaImageFallback({ symbol, src }: { symbol: string; src: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <ManaSymbolFallback symbol={symbol} />
  }

  return <img src={src} alt={`{${symbol}}`} className="h-3.5 w-3.5" onError={() => setFailed(true)} />
}
