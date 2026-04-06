export { validateManifest, ManifestSchema } from './manifest'
export { initSes, runLogicModule, sandboxApi } from './sandbox'
export type { TemplateSandboxApi } from './sandbox'
export { CardCanvas, CARD_WIDTH, CARD_HEIGHT } from './primitives/CardCanvas'
export { TextField } from './primitives/TextField'
export { ArtBox } from './primitives/ArtBox'
export { ManaText } from './primitives/ManaText'
export { RulesBox } from './primitives/RulesBox'
export { PtBox } from './primitives/PtBox'

// Generic template props type — templates receive this
export interface TemplateProps<T extends Record<string, string | undefined> = Record<string, string | undefined>> {
  fields: T
  /** Absolute path to the template's assets directory */
  assetsPath: string
}
