export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  language?: string;
  content?: string;
}

export type ActiveTab = string;

export interface WorkspaceState {
  files: FileNode[];
  activeTab: ActiveTab | null;
  openTabs: string[];
  activeLeftMenu: 'explorer' | 'settings' | null;
  activeRightMenu: 'tests' | 'constraints' | null;
  activeBottomMenu: 'analysis' | 'test-output' | 'terminal' | null;
}