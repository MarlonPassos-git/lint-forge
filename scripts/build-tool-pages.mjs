import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { toolListings } from '../src/domain/tools/catalog.ts'

// GitHub Pages has no SPA rewrite: publish a real entrypoint for every deep link.
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
for (const tool of toolListings) {
  const directory = new URL(`../dist/${tool.id}/`, import.meta.url)
  await mkdir(directory, { recursive: true })
  const page = html
    .replace(/<title>.*?<\/title>/, `<title>${tool.name} Config Builder - Lint Forge</title>`)
    .replace(
      'rel="canonical" href="https://lint-forge.marlonpassos.com.br/"',
      `rel="canonical" href="https://lint-forge.marlonpassos.com.br/${tool.id}"`,
    )
  await writeFile(new URL('index.html', directory), page)
}
await writeFile(new URL('../dist/404.html', import.meta.url), html)
