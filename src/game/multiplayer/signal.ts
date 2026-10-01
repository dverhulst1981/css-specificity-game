export class SignalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SignalError'
  }
}

export async function encodeSignal(sdp: string): Promise<string> {
  const stream = new Blob([sdp]).stream().pipeThrough(new CompressionStream('gzip'))
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer())
  return bytesToBase64Url(bytes)
}

export async function decodeSignal(code: string): Promise<string> {
  try {
    const bytes = base64UrlToBytes(code.replace(/\s+/g, ''))
    const stream = blobFromBytes(bytes).stream().pipeThrough(new DecompressionStream('gzip'))
    let sdp = (await new Response(stream).text()).replace(/^[\uFEFF\r\n\t ]+/, '')
    if (!sdp.startsWith('v=0')) throw new Error('geen sdp')
    if (!sdp.endsWith('\n')) sdp += '\r\n'
    return sdp
  } catch (error) {
    if (error instanceof SignalError) throw error
    throw new SignalError('Die code is geen geldige verbinding. Plak de hele code.')
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
