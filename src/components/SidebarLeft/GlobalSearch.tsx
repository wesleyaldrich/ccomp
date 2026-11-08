import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { load } from '@tauri-apps/plugin-store';
import { 
  VscChevronDown, 
  VscChevronRight, 
  VscEllipsis, 
  VscCaseSensitive, 
  VscWholeWord, 
  VscRegex, 
  VscRefresh, 
  VscClearAll, 
  VscCollapseAll,
  VscReplaceAll
} from 'react-icons/vsc';
import { FileIcon } from './FileIcon'; 
import styles from './GlobalSearch.module.css';

interface SearchResult {
  file_path: string;
  line_number: number;
  line_text: string;
}

interface GlobalSearchProps {
  onSelectFile?: (filePath: string) => void;
}

export function GlobalSearch({ onSelectFile }: GlobalSearchProps) {
  const [workspacePath, setWorkspacePath] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [includePattern, setIncludePattern] = useState('');
  const [excludePattern, setExcludePattern] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [matchCase, setMatchCase] = useState(false);
  const [matchWholeWord, setMatchWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [preserveCase, setPreserveCase] = useState(false);

  const [isIncludeFocused, setIsIncludeFocused] = useState(false);
  const [isExcludeFocused, setIsExcludeFocused] = useState(false);

  const [results, setResults] = useState<Record<string, SearchResult[]>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadWorkspace() {
      const store = await load('ccomp_explorer.json', { autoSave: false });
      const savedPath = await store.get<string>('workspacePath');
      if (savedPath) setWorkspacePath(savedPath);
    }
    void loadWorkspace();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim() && workspacePath) {
        performSearch();
      } else {
        setResults({});
      }
    }, 300);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, includePattern, excludePattern, matchCase, matchWholeWord, useRegex, workspacePath]);

  async function performSearch() {
    setIsSearching(true);
    try {
      const data = await invoke<SearchResult[]>('search_in_files', {
        dirPath: workspacePath,
        query: searchQuery,
        includePattern: includePattern.trim() ? includePattern : null,
        excludePattern: excludePattern.trim() ? excludePattern : null,
        matchCase,
        matchWholeWord,
        useRegex,
      });

      const grouped = data.reduce((acc, curr) => {
        if (!acc[curr.file_path]) acc[curr.file_path] = [];
        acc[curr.file_path].push(curr);
        return acc;
      }, {} as Record<string, SearchResult[]>);

      setResults(grouped);
      setCollapsedFiles(new Set()); 
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }

  const handleReplaceAll = async () => {
    if (!searchQuery.trim()) return;
    try {
      const filePaths = Object.keys(results);
      for (const filePath of filePaths) {
        await invoke('replace_in_file', {
          filePath,
          query: searchQuery,
          replaceText: replaceQuery,
          matchCase,
          matchWholeWord,
          useRegex,
          preserveCase,
        });
      }
      performSearch();
      window.dispatchEvent(new CustomEvent('ccomp:fs-changed'));
    } catch (err) {
      alert(`Gagal melakukan Replace: ${err}`);
    }
  };

  const getFileName = (path: string) => path.split(/[/\\]/).pop() || path;
  
  const getRelativeDirPath = (path: string) => {
    const normalizedPath = path.replace(/\\/g, '/');
    const segments = normalizedPath.split('/').filter(Boolean);
    if (segments.length <= 1) return '';
    const dirSegments = segments.slice(0, -1);
    
    if (workspacePath) {
      const normWorkspace = workspacePath.replace(/\\/g, '/');
      const workspaceSegments = normWorkspace.split('/').filter(Boolean);
      let matchIndex = 0;
      for (let i = 0; i < dirSegments.length && i < workspaceSegments.length; i++) {
        if (dirSegments[i].toLowerCase() === workspaceSegments[i].toLowerCase()) {
          matchIndex = i + 1;
        } else {
          break;
        }
      }
      const remainingSegments = dirSegments.slice(matchIndex);
      if (remainingSegments.length > 0) {
        const sep = path.includes('\\') ? '\\' : '/';
        return remainingSegments.join(sep);
      }
    }
    const lastFew = dirSegments.slice(-3);
    const sep = path.includes('\\') ? '\\' : '/';
    return lastFew.join(sep);
  };

  const toggleCollapse = (filePath: string) => {
    setCollapsedFiles(prev => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      return next;
    });
  };

  const handleRefresh = () => { if (searchQuery) performSearch(); };
  const handleClear = () => { setSearchQuery(''); setResults({}); };
  const handleToggleCollapseAll = () => {
    const allKeys = Object.keys(results);
    if (collapsedFiles.size === allKeys.length) {
      setCollapsedFiles(new Set());
    } else {
      setCollapsedFiles(new Set(allKeys));
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    try {
      const parts = text.split(new RegExp(`(${query})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className={styles.highlight}>{part}</span>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  const handleMatchClick = (filePath: string, lineNumber: number) => {
    const detail = { path: filePath, line: lineNumber, word: searchQuery };
    ;(window as any).__pendingSearchJump = detail;
    window.dispatchEvent(new CustomEvent('ccomp:search-goto', { detail }));
    onSelectFile?.(filePath);
  };

  const resultCount = Object.values(results).flat().length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span>Search</span>
        <div className={styles.headerActions}>
          <button title="Refresh" onClick={handleRefresh} className={styles.iconButton}>
            <VscRefresh size={14} />
          </button>
          <button title="Clear Search Results" onClick={handleClear} className={styles.iconButton}>
            <VscClearAll size={14} />
          </button>
          <button title="Toggle Collapse All" onClick={handleToggleCollapseAll} className={styles.iconButton}>
            <VscCollapseAll size={14} />
          </button>
        </div>
      </div>
      
      <div className={styles.inputContainer}>
        <div className={styles.searchRow}>
          <button 
            className={`${styles.expandReplaceBtn} ${isReplaceOpen ? styles.open : ''}`}
            onClick={() => setIsReplaceOpen(!isReplaceOpen)}
            title="Toggle Replace"
          >
            {isReplaceOpen ? <VscChevronDown size={14} /> : <VscChevronRight size={14} />}
          </button>
          
          <div className={styles.inputWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className={styles.searchOptions}>
              <button 
                className={`${styles.optionBtn} ${matchCase ? styles.active : ''}`}
                onClick={() => setMatchCase(!matchCase)}
                title="Match Case"
              >
                <VscCaseSensitive size={13} />
              </button>
              <button 
                className={`${styles.optionBtn} ${matchWholeWord ? styles.active : ''}`}
                onClick={() => setMatchWholeWord(!matchWholeWord)}
                title="Match Whole Word"
              >
                <VscWholeWord size={13} />
              </button>
              <button 
                className={`${styles.optionBtn} ${useRegex ? styles.active : ''}`}
                onClick={() => setUseRegex(!useRegex)}
                title="Use Regular Expression"
              >
                <VscRegex size={13} />
              </button>
            </div>
          </div>
        </div>

        {isReplaceOpen && (
          <div className={styles.searchRow} style={{ marginTop: '4px' }}>
            <div style={{ width: '16px', flexShrink: 0 }} />
            <div className={styles.inputWrapper}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Replace"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
              />
              <div className={styles.searchOptions}>
                <button 
                  className={`${styles.optionBtn} ${preserveCase ? styles.active : ''}`}
                  onClick={() => setPreserveCase(!preserveCase)}
                  title="Preserve Case"
                >
                  <span style={{ fontSize: '10px', fontWeight: 'bold' }}>AB</span>
                </button>
              </div>
            </div>
            {/* Tombol icon Replace All di luar field sebelah kanan */}
            <div className={styles.externalActionWrapper}>
              <button 
                className={styles.iconButton}
                onClick={handleReplaceAll}
                disabled={resultCount === 0}
                title="Replace All"
              >
                <VscReplaceAll size={15} />
              </button>
            </div>
          </div>
        )}
        
        {showAdvanced && (
          <div className={styles.advancedInputs}>
            <label className={styles.inputLabel}>files to include</label>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={isIncludeFocused ? "e.g. *.ts, src/**/include" : ""}
              value={includePattern}
              onChange={(e) => setIncludePattern(e.target.value)}
              onFocus={() => setIsIncludeFocused(true)}
              onBlur={() => setIsIncludeFocused(false)}
            />
            
            <label className={styles.inputLabel}>files to exclude</label>
            <input
              type="text"
              className={styles.searchInput}
              placeholder={isExcludeFocused ? "e.g. *.ts, src/**/exclude" : ""}
              value={excludePattern}
              onChange={(e) => setExcludePattern(e.target.value)}
              onFocus={() => setIsExcludeFocused(true)}
              onBlur={() => setIsExcludeFocused(false)}
            />
          </div>
        )}
        
        <div className={styles.ellipsisToggle} onClick={() => setShowAdvanced(!showAdvanced)}>
          <VscEllipsis size={16} />
        </div>
      </div>

      <div className={styles.resultsContainer}>
        {isSearching && <div className={styles.statusText}>Searching...</div>}
        
        {!isSearching && searchQuery && resultCount === 0 && (
          <div className={styles.statusText}>No results found.</div>
        )}

        {!isSearching && resultCount > 0 && (
          <div className={styles.resultSummary}>
            {resultCount} results in {Object.keys(results).length} files
          </div>
        )}

        <div className={styles.resultList}>
          {Object.entries(results).map(([filePath, fileResults]) => {
            const isCollapsed = collapsedFiles.has(filePath);
            
            return (
              <div key={filePath} className={styles.fileGroup}>
                <div 
                  className={styles.fileHeader} 
                  onClick={() => toggleCollapse(filePath)}
                >
                  <span className={styles.chevron}>
                    {isCollapsed ? <VscChevronRight size={16} /> : <VscChevronDown size={16} />}
                  </span>
                  <span className={styles.fileIcon}>
                    <FileIcon fileName={getFileName(filePath)} isDir={false} isOpen={false} />
                  </span>
                  <span className={styles.fileName}>{getFileName(filePath)}</span>
                  <span className={styles.filePath}>{getRelativeDirPath(filePath)}</span>
                </div>
                
                {!isCollapsed && fileResults.map((res, idx) => (
                  <div 
                    key={`${filePath}-${idx}`} 
                    className={styles.matchItem}
                    onClick={() => handleMatchClick(filePath, res.line_number)}
                  >
                    <span className={styles.matchText}>
                      {highlightText(
                        res.line_text.length > 80 ? res.line_text.substring(0, 80) + '...' : res.line_text,
                        searchQuery
                      )}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
