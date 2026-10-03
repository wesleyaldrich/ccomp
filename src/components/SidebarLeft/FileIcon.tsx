/* Pake lib icons dari react */
import { ReactNode } from 'react';
import { 
  VscFolder, 
  VscFolderOpened, 
  VscFile, 
  VscFileCode, 
  VscFileBinary, 
  VscJson, 
  VscMarkdown 
} from 'react-icons/vsc';
import { 
  SiC, 
  SiCplusplus, 
  SiPython, 
  SiRust, 
  SiJavascript, 
  SiTypescript, 
  SiReact, 
  SiHtml5, 
  SiCss
} from 'react-icons/si';

interface FileIconProps {
  fileName: string;
  isDir: boolean;
  isOpen?: boolean;
}

interface IconConfig {
  icon: ReactNode;
  color: string;
}

/* Mapping khusus untuk Beberapa file */
const EXACT_FILE_MAP: Record<string, IconConfig> = {
  '.gitignore': { icon: <VscFileCode />, color: '#f05032' },
  'package.json': { icon: <VscJson />, color: '#e5a50a' },
  'cargo.toml': { icon: <SiRust />, color: '#dea584' },
  'tsconfig.json': { icon: <SiTypescript />, color: '#3178c6' },
};

/* Mapping berdasarkan File Extension */
const EXTENSION_MAP: Record<string, IconConfig> = {
  /* C / C++ */
  c: { icon: <SiC />, color: '#a8b9cc' },
  cpp: { icon: <SiCplusplus />, color: '#00599c' },
  cc: { icon: <SiCplusplus />, color: '#00599c' },
  h: { icon: <SiCplusplus />, color: '#00599c' },
  hpp: { icon: <SiCplusplus />, color: '#00599c' },

  /* Languages */
  rs: { icon: <SiRust />, color: '#dea584' },
  py: { icon: <SiPython />, color: '#3776ab' },
  js: { icon: <SiJavascript />, color: '#f7df1e' },
  mjs: { icon: <SiJavascript />, color: '#f7df1e' },
  cjs: { icon: <SiJavascript />, color: '#f7df1e' },
  ts: { icon: <SiTypescript />, color: '#3178c6' },
  jsx: { icon: <SiReact />, color: '#61dafb' },
  tsx: { icon: <SiReact />, color: '#61dafb' },

  /* Web Styles & Markup */
  html: { icon: <SiHtml5 />, color: '#e34f26' },
  css: { icon: <SiCss />, color: '#1572b6' },
  scss: { icon: <SiCss />, color: '#1572b6' },
  less: { icon: <SiCss />, color: '#1572b6' },

  /* Data & Docs */
  json: { icon: <VscJson />, color: '#cbcb41' },
  md: { icon: <VscMarkdown />, color: '#42a5f5' },
  mdx: { icon: <VscMarkdown />, color: '#42a5f5' },

  /* Binaries */
  exe: { icon: <VscFileBinary />, color: '#e06c75' },
  dll: { icon: <VscFileBinary />, color: '#e06c75' },
  bin: { icon: <VscFileBinary />, color: '#e06c75' },

  /* Kalau mau nambah bisa add disini */
};

export function FileIcon({ fileName, isDir, isOpen = false }: FileIconProps) {
  /* Handling Folder */
  if (isDir) {
    const FolderIcon = isOpen ? VscFolderOpened : VscFolder;
    return <FolderIcon style={{ color: '#dcb67a', fontSize: '15px' }} />;
  }

  const lowerName = fileName.toLowerCase();

  /* Cek File Environment  */
  if (lowerName.startsWith('.env')) {
    return <VscFileCode style={{ color: '#ecd53f', fontSize: '14px' }} />;
  }

  /* Cek Mapping khusus tadi  */
  if (EXACT_FILE_MAP[lowerName]) {
    const { icon, color } = EXACT_FILE_MAP[lowerName];
    return <span style={{ color, fontSize: '14px', display: 'flex' }}>{icon}</span>;
  }

  /* Ambil extension file nya  */
  const lastDotIndex = lowerName.lastIndexOf('.');
  const ext = lastDotIndex > 0 ? lowerName.slice(lastDotIndex + 1) : '';

  /* Cek extension file nya  */
  if (ext && EXTENSION_MAP[ext]) {
    const { icon, color } = EXTENSION_MAP[ext];
    return <span style={{ color, fontSize: '14px', display: 'flex' }}>{icon}</span>;
  }

  /* Default  */
  return <VscFile style={{ color: '#858585', fontSize: '14px' }} />;
}