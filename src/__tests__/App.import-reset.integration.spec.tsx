import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

describe('App import and reset flow', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
  })

  it('announces invalid imported config errors', async () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Base file'), {
      target: { value: '{ invalid json' },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Start from this config' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid biome config')
  })

  it.each(['null', '[]', 'true'])('rejects non-object JSON config %s', async (inputText) => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Base file'), {
      target: { value: inputText },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Start from this config' }))

    expect(screen.getByRole('alert')).toHaveTextContent('expected JSON object')
    expect(screen.getByRole('heading', { name: 'Lint Forge' })).toBeVisible()
  })

  it('requires modal confirmation before resetting review state', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Reset review' }))

    expect(screen.getByRole('dialog', { name: 'Reset review?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset everything' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('keeps review state when reset is canceled', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'JavaScript' }))
    await userEvent.click(screen.getByRole('button', { name: 'Reset review' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('checkbox', { name: 'JavaScript' })).not.toBeChecked()
    expect(screen.queryByRole('dialog', { name: 'Reset review?' })).not.toBeInTheDocument()
  })
})
