import type {
  CardDraftSet,
  Card,
  InstalledTemplate,
  NewSet,
  NewCard,
  UpdateCard,
  UpdateSet,
} from '@card-draft/core/types'

export interface ExportPngOptions {
  cardId: string
  pixelRatio: number
  outputPath: string
}

export interface ExportPdfOptions {
  setId: string
  pixelRatio: number
  outputPath: string
  cardsPerRow: number
  cardsPerColumn: number
  bleedInches: number
  pageSize: 'Letter' | 'A4' | 'A3'
}

export interface IpcApi {
  system: {
    platform: string
  }
  sets: {
    list: () => Promise<CardDraftSet[]>
    create: (data: NewSet) => Promise<CardDraftSet>
    get: (id: string) => Promise<CardDraftSet | null>
    update: (id: string, data: UpdateSet) => Promise<CardDraftSet>
    delete: (id: string) => Promise<void>
  }
  cards: {
    list: (setId: string) => Promise<Card[]>
    create: (data: NewCard) => Promise<Card>
    get: (id: string) => Promise<Card | null>
    update: (id: string, data: UpdateCard) => Promise<Card>
    delete: (id: string) => Promise<void>
    reorder: (setId: string, orderedIds: string[]) => Promise<void>
  }
  templates: {
    list: () => Promise<InstalledTemplate[]>
    installFromFolder: (folderPath: string) => Promise<InstalledTemplate>
  }
  export: {
    png: (options: ExportPngOptions) => Promise<void>
    pdf: (options: ExportPdfOptions) => Promise<void>
    pickSavePath: (options: { defaultName: string; ext: string }) => Promise<string | null>
    pickFolder: () => Promise<string | null>
  }
  dialog: {
    openFile: (options: { filters?: Electron.FileFilter[] }) => Promise<string | null>
    openFolder: () => Promise<string | null>
  }
}

// Augment the global window type so TypeScript knows about window.api
declare global {
  interface Window {
    api: IpcApi
  }
}
