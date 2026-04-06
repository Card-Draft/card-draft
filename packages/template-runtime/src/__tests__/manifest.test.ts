import { describe, it, expect } from 'vitest'
import { validateManifest } from '../manifest'

const validManifest = {
  name: 'magic-m15',
  displayName: 'Magic M15',
  version: '1.0.0',
  game: 'magic',
  author: 'Test',
  cardSize: { width: 2.5, height: 3.5, unit: 'in' },
  fields: [{ id: 'name', type: 'text', label: 'Card Name', required: true }],
}

describe('validateManifest', () => {
  it('accepts a valid manifest', () => {
    expect(() => validateManifest(validManifest)).not.toThrow()
  })

  it('rejects missing name', () => {
    expect(() => validateManifest({ ...validManifest, name: undefined })).toThrow()
  })

  it('rejects non-kebab-case name', () => {
    expect(() => validateManifest({ ...validManifest, name: 'Magic M15' })).toThrow()
  })

  it('rejects invalid semver version', () => {
    expect(() => validateManifest({ ...validManifest, version: 'v1' })).toThrow()
  })

  it('rejects empty fields array', () => {
    expect(() => validateManifest({ ...validManifest, fields: [] })).toThrow()
  })

  it('rejects unknown field type', () => {
    expect(() =>
      validateManifest({
        ...validManifest,
        fields: [{ id: 'x', type: 'unknown', label: 'X' }],
      }),
    ).toThrow()
  })
})
