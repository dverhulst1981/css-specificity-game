const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')

export function appPath(pathname: string): string {
  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
    const rest = pathname.slice(basePath.length)
    if (!rest || rest === '/') return '/'
    return rest.startsWith('/') ? rest : `/${rest}`
  }
  return pathname || '/'
}

export function publicPath(path: string): string {
  if (!basePath) return path
  if (path === '/' || path === '') return `${basePath}/`
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`
}
