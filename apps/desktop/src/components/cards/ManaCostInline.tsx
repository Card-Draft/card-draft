import { useState } from 'react'
import { getMagicM15DomAssetsPath } from '../../lib/templateAssets'
import { tokenizeCanonicalManaCost } from '../../lib/manaCost'

function getManaSymbolAsset(symbol: string) {
  const assetsPath = getMagicM15DomAssetsPath()
  const normalized = symbol.toLowerCase()
  const svgSymbol = normalized.replace(/\//g, '')
  const flatSymbolMap: Record<string, string> = {
    w: 'mana_w.png',
    u: 'mana_u.png',
    b: 'mana_b.png',
    r: 'mana_r.png',
    g: 'mana_g.png',
    c: 'mana_c.png',
    t: 'mana_t.png',
  }

  const flatAsset = flatSymbolMap[normalized]
  if (flatAsset) {
    return {
      src: `${assetsPath}/symbols-flat/${flatAsset}`,
      className: 'h-3.5 w-3.5',
    }
  }

  return {
    src: `${assetsPath}/symbols/${svgSymbol}.svg`,
    className: 'h-3.5 w-3.5',
  }
}

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

        const asset = getManaSymbolAsset(token.value)
        return (
          <InlineManaSymbol
            key={`${token.kind}-${token.value}-${index}`}
            symbol={token.value}
            src={asset.src}
            className={asset.className}
          />
        )
      })}
    </span>
  )
}

function InlineManaSymbol({
  symbol,
  src,
  className,
}: {
  symbol: string
  src: string
  className: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <ManaSymbolFallback symbol={symbol} />
  }

  return (
    <img
      src={src}
      alt={`{${symbol}}`}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
