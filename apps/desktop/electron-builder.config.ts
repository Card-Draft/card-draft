import type { Configuration } from 'electron-builder'

const config: Configuration = {
  appId: 'app.carddraft.desktop',
  productName: 'Card Draft',
  copyright: 'Copyright © 2025 Card Draft Contributors',
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: ['dist/**', 'out/**'],
  mac: {
    target: [
      { target: 'dmg', arch: ['arm64', 'x64'] },
      { target: 'zip', arch: ['arm64', 'x64'] },
    ],
    category: 'public.app-category.graphics-design',
    icon: 'build/icon.icns',
  },
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'build/icon.ico',
  },
  linux: {
    target: [{ target: 'AppImage', arch: ['x64'] }],
    category: 'Graphics',
    icon: 'build/icon.png',
  },
  publish: {
    provider: 'github',
    owner: 'card-draft',
    repo: 'card-draft',
  },
}

export default config
