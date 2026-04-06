export function getMagicM15AssetsPath() {
  return `file://${import.meta.env.DEV
    ? `${window.location.origin}/../../templates/magic-m15/assets`
    : '../templates/magic-m15/assets'}`
}

export function getMagicM15DomAssetsPath() {
  return import.meta.env.DEV
    ? `${window.location.origin}/../../templates/magic-m15/assets`
    : '../templates/magic-m15/assets'
}
