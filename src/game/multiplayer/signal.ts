export class SignalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SignalError'
  }
}

const incomplete =
  'De code is niet volledig. Gebruik Kopieer de code en plak het hele blok, ook de regels die je moet scrollen.'

export async function encodeSignal(sdp: string, role: 'o' | 'a'): Promise<string> {
  const stream = new Blob([sdp]).stream().pipeThrough(new CompressionStream('gzip'))
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer())
  const payload = bytesToBase64Url(bytes)
  const body = `1.${role}.${payload.length}.${payload}`
  return body.replace(/(.{64})/g, '$1\n').replace(/\n$/, '')
}

export async function decodeSignal(code: string): Promise<{ role: 'o' | 'a'; sdp: string }> {
  const compact = code.replace(/\s+/g, '')
  const match = /^1\.([oa])\.(\d+)\.(.+)$/.exec(compact)
  if (!match) throw new SignalError(incomplete)
  const role = match[1] as 'o' | 'a'
  const expected = Number(match[2])
  const payload = match[3]
  if (payload.length !== expected) {
    throw new SignalError(
      `De code telt ${payload.length} tekens, het moeten er ${expected} zijn. Kopieer opnieuw met de knop.`,
    )
  }
  try {
    const bytes = base64UrlToBytes(payload)
    const stream = blobFromBytes(bytes).stream().pipeThrough(new DecompressionStream('gzip'))
    let sdp = (await new Response(stream).text()).replace(/^[\uFEFF\r\n\t ]+/, '')
    if (!sdp.startsWith('v=0')) throw new Error('geen sdp')
    if (!sdp.endsWith('\n')) sdp += '\r\n'
    return { role, sdp }
  } catch (error) {
    if (error instanceof SignalError) throw error
    throw new SignalError(incomplete)
  }
}

function blobFromBytes(bytes: Uint8Array): Blob {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return new Blob([buffer])
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  const size = 0x8000
  for (let index = 0; index < bytes.length; index += size) {
    binary += String.fromCharCode(...bytes.subarray(index, index + size))
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}
