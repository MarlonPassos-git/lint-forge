import { describe, expect, it } from 'vitest'
import type { ReviewSnapshot } from '../../domain/types'
import { clearReviewSnapshot, loadReviewSnapshot, saveReviewSnapshot } from '../localReviewStore'

class MemoryReviewStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const snapshot: ReviewSnapshot = {
  baseConfigText: '{}',
  choices: [{ ruleKey: 'style/useConst', decision: 'warn' }],
  currentIndex: 1,
  panels: {
    inputVisible: false,
    outputVisible: true,
  },
  filters: {
    selectedCategories: ['CSS', 'JSON'],
  },
}

describe('loadReviewSnapshot', () => {
  it('returns null when no snapshot exists', () => {
    expect(loadReviewSnapshot(new MemoryReviewStorage())).toBeNull()
  })

  it('migrates legacy ignored choices to off decisions', () => {
    const storage = new MemoryReviewStorage()
    storage.setItem(
      'biome-rule-swipe:v1',
      JSON.stringify({
        ...snapshot,
        choices: [{ ruleKey: 'style/useConst', decision: 'ignored' }],
      }),
    )

    expect(loadReviewSnapshot(storage)?.choices).toEqual([
      { ruleKey: 'style/useConst', decision: 'off' },
    ])
  })

  it('keeps snapshots compatible when optional legacy fields are absent', () => {
    const storage = new MemoryReviewStorage()
    const legacySnapshot = {
      baseConfigText: '{}',
      choices: [],
      currentIndex: 0,
    }
    storage.setItem('biome-rule-swipe:v1', JSON.stringify(legacySnapshot))

    expect(loadReviewSnapshot(storage)).toEqual(legacySnapshot)
  })

  it.each([
    ['null root', null],
    ['array root', []],
    ['missing base config', { choices: [], currentIndex: 0 }],
    ['non-string base config', { baseConfigText: null, choices: [], currentIndex: 0 }],
    ['missing choices', { baseConfigText: '{}', currentIndex: 0 }],
    ['non-array choices', { baseConfigText: '{}', choices: {}, currentIndex: 0 }],
    ['malformed choice', { baseConfigText: '{}', choices: [null], currentIndex: 0 }],
    [
      'empty rule key',
      { baseConfigText: '{}', choices: [{ ruleKey: '', decision: 'warn' }], currentIndex: 0 },
    ],
    [
      'invalid decision',
      {
        baseConfigText: '{}',
        choices: [{ ruleKey: 'style/useConst', decision: 'skip' }],
        currentIndex: 0,
      },
    ],
    ['missing current index', { baseConfigText: '{}', choices: [] }],
    ['invalid current index', { baseConfigText: '{}', choices: [], currentIndex: -1 }],
    ['fractional current index', { baseConfigText: '{}', choices: [], currentIndex: 0.5 }],
    ['non-object panels', { baseConfigText: '{}', choices: [], currentIndex: 0, panels: [] }],
    [
      'invalid input visibility',
      {
        baseConfigText: '{}',
        choices: [],
        currentIndex: 0,
        panels: { inputVisible: 1, outputVisible: true },
      },
    ],
    ['invalid panels', { ...snapshot, panels: { inputVisible: true } }],
    ['non-object filters', { baseConfigText: '{}', choices: [], currentIndex: 0, filters: [] }],
    [
      'non-array categories',
      { baseConfigText: '{}', choices: [], currentIndex: 0, filters: { selectedCategories: {} } },
    ],
    ['invalid categories', { ...snapshot, filters: { selectedCategories: ['Unknown'] } }],
  ])('removes %s snapshots', (_label, invalidSnapshot) => {
    const storage = new MemoryReviewStorage()
    storage.setItem('biome-rule-swipe:v1', JSON.stringify(invalidSnapshot))

    expect(loadReviewSnapshot(storage)).toBeNull()
    expect(storage.length).toBe(0)
  })

  it('removes corrupted snapshots', () => {
    const storage = new MemoryReviewStorage()
    storage.setItem('biome-rule-swipe:v1', '{bad')

    expect(loadReviewSnapshot(storage)).toBeNull()
    expect(storage.length).toBe(0)
  })
})

describe('saveReviewSnapshot', () => {
  it('persists a review snapshot', () => {
    const storage = new MemoryReviewStorage()

    saveReviewSnapshot(storage, snapshot)

    expect(loadReviewSnapshot(storage)).toEqual(snapshot)
  })
})

describe('clearReviewSnapshot', () => {
  it('removes the saved review snapshot', () => {
    const storage = new MemoryReviewStorage()
    saveReviewSnapshot(storage, snapshot)

    clearReviewSnapshot(storage)

    expect(loadReviewSnapshot(storage)).toBeNull()
  })
})
