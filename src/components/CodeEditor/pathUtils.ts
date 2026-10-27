const LANGUAGE_BY_EXT: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  rs: 'rust',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  json: 'json',
  css: 'css',
  html: 'html',
  py: 'python',
  md: 'markdown',
  txt: 'plaintext',
};

/** "C:\\proj\\src\\main.c" -> "main.c" */
export function basename(path: string): string {
  return path.split(/[/\\]/).pop() || path;
}

/** "main.c" -> "c" (nama bahasa untuk Monaco) */
export function languageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return LANGUAGE_BY_EXT[ext] ?? 'plaintext';
}

/** Samakan format path supaya aman dibandingkan (slash, trailing slash, huruf besar/kecil di Windows) */
export function normalizePath(path: string): string {
  let p = path.replace(/\\/g, '/').replace(/\/+$/, '');
  if (/^[a-zA-Z]:/.test(p)) p = p.toLowerCase(); // drive letter = Windows = case-insensitive
  return p;
}

export function samePath(a: string, b: string): boolean {
  return normalizePath(a) === normalizePath(b);
}

/** true kalau `path` sama dengan `parent` atau berada di dalam folder `parent` */
export function isSameOrChildPath(path: string, parent: string): boolean {
  const p = normalizePath(path);
  const q = normalizePath(parent);
  return p === q || p.startsWith(q + '/');
}