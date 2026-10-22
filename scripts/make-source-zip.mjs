/**
 * Builds a ZIP archive of the YAgent source tree with no external dependency:
 * no `zip` binary, no npm package. The container is assembled with node:zlib
 * (raw DEFLATE) plus a small CRC-32 implementation, so `npm run source:zip`
 * (and the dev-server route `/yagent-source.zip`) work anywhere Node runs.
 *
 * Usage:
 *   node scripts/make-source-zip.mjs                  # -> /tmp/yagent-ui-source.zip
 *   node scripts/make-source-zip.mjs --out ./out.zip
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { deflateRawSync } from 'node:zlib'

/** Top-level entries that belong to the deliverable. */
export const INCLUDED_ENTRIES = [
  '.base44',
  'docker',
  'public',
  'scripts',
  'src',
  '.gitignore',
  'AGENTS.md',
  'README.md',
  'docker-compose.base44.yml',
  'index.html',
  'package.json',
  'package-lock.json',
  'postcss.config.js',
  'tailwind.config.js',
  'tsconfig.json',
  'vite.config.ts',
]

const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-ssr', '.git', '.vite', '.idea', '.vscode'])
const SKIP_FILES = new Set(['.DS_Store'])

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let crc = -1
  for (let i = 0; i < buffer.length; i += 1) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

function dosDateTime(date = new Date()) {
  const time =
    ((date.getHours() & 0x1f) << 11) | ((date.getMinutes() & 0x3f) << 5) | ((date.getSeconds() / 2) & 0x1f)
  const day =
    (((date.getFullYear() - 1980) & 0x7f) << 9) | (((date.getMonth() + 1) & 0x0f) << 5) | (date.getDate() & 0x1f)
  return { time, day }
}

export function buildZipArchive(files) {
  const parts = []
  const central = []
  const { time, day } = dosDateTime()
  let offset = 0

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, 'utf8')
    const raw = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8')
    const deflated = deflateRawSync(raw, { level: 9 })
    const stored = deflated.length < raw.length
    const payload = stored ? deflated : raw
    const method = stored ? 8 : 0
    const crc = crc32(raw)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6) // UTF-8 file names
    local.writeUInt16LE(method, 8)
    local.writeUInt16LE(time, 10)
    local.writeUInt16LE(day, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(payload.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(nameBuffer.length, 26)
    local.writeUInt16LE(0, 28)
    parts.push(local, nameBuffer, payload)

    const entry = Buffer.alloc(46)
    entry.writeUInt32LE(0x02014b50, 0)
    entry.writeUInt16LE(20, 4) // version made by
    entry.writeUInt16LE(20, 6) // version needed
    entry.writeUInt16LE(0x0800, 8)
    entry.writeUInt16LE(method, 10)
    entry.writeUInt16LE(time, 12)
    entry.writeUInt16LE(day, 14)
    entry.writeUInt32LE(crc, 16)
    entry.writeUInt32LE(payload.length, 20)
    entry.writeUInt32LE(raw.length, 24)
    entry.writeUInt16LE(nameBuffer.length, 28)
    entry.writeUInt16LE(0, 30) // extra length
    entry.writeUInt16LE(0, 32) // comment length
    entry.writeUInt16LE(0, 34) // disk number
    entry.writeUInt16LE(0, 36) // internal attributes
    // `<<` yields a signed int32, and 0o100644 << 16 has the high bit set, so the
    // result must be coerced back to unsigned before writeUInt32LE.
    entry.writeUInt32LE((0o100644 << 16) >>> 0, 38) // external attributes (unix mode)
    entry.writeUInt32LE(offset, 42)
    central.push(entry, nameBuffer)

    offset += local.length + nameBuffer.length + payload.length
  }

  const centralBuffer = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralBuffer.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([...parts, centralBuffer, end])
}

async function collect(rootDir, relativeDir = '', out = []) {
  const entries = await readdir(path.join(rootDir, relativeDir), { withFileTypes: true })
  for (const entry of entries) {
    const relative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name
    const isTopLevel = relativeDir === ''
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      if (isTopLevel && !INCLUDED_ENTRIES.includes(entry.name)) continue
      await collect(rootDir, relative, out)
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name) || entry.name.endsWith('.zip')) continue
      if (isTopLevel && !INCLUDED_ENTRIES.includes(entry.name)) continue
      out.push({ name: relative, data: await readFile(path.join(rootDir, relative)) })
    }
  }
  return out
}

export async function buildSourceZip(rootDir) {
  const files = await collect(rootDir)
  files.sort((a, b) => a.name.localeCompare(b.name))
  return buildZipArchive(files)
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (invokedDirectly) {
  const outIndex = process.argv.indexOf('--out')
  const outPath = outIndex > -1 ? process.argv[outIndex + 1] : '/tmp/yagent-ui-source.zip'
  const root = process.cwd()
  const archive = await buildSourceZip(root)
  await mkdir(path.dirname(path.resolve(outPath)), { recursive: true })
  await writeFile(outPath, archive)
  console.log(`YAgent source archive: ${path.resolve(outPath)} (${(archive.length / 1024).toFixed(1)} KB)`)
}
