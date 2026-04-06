export function getMagicM15AssetsPath() {
  // In dev, Vite serves the templates folder as publicDir at the renderer root,
  // so /magic-m15/assets/* resolves correctly via the dev server.
  // In prod, assets sit next to the renderer index.html.
  return import.meta.env.DEV
    ? '/magic-m15/assets'
    : '../templates/magic-m15/assets'
}

export function getMagicM15DomAssetsPath() {
  return getMagicM15AssetsPath()
}
