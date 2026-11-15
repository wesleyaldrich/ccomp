export type SettingsTab = 'general' | 'rules' | 'compiler';

export type RuleCategory = 'Correctness' | 'Safety' | 'Performance' | 'Style';
export type RuleSeverity = 'Error' | 'Warning' | 'Info';

export interface AnalysisRule {
    id: string;
    name: string;
    category: RuleCategory;
    severity: RuleSeverity;
    enabled: boolean;
    description: string;
}

export interface CompilerEntry {
    id: string;
    name: string;
    path: string;
    version: string;
    language: string;
    available: boolean;
    isDefault: boolean;
    isBuiltIn?: boolean;
}

export interface GeneralSettings {
    autoSave: boolean;
    autoSaveDelayMs: number;
    fontFamily: string;
    fontSize: number;
    tabSize: number;
}

export interface CompilerSettings {
    cStandard: string;
    optimizationLevel: string;
    enableAllWarnings: boolean;
    timeLimitMs: number;
    compilers: CompilerEntry[];
}

export interface AppSettings {
    general: GeneralSettings;
    rules: AnalysisRule[];
    compiler: CompilerSettings;
}

export const DEFAULT_RULES: AnalysisRule[] = [
    {
        id: 'R001',
        name: 'Unused Variables',
        category: 'Correctness',
        severity: 'Warning',
        enabled: true,
        description: 'Detect variables that are declared but never used.',
    },
    {
        id: 'R002',
        name: 'Suspicious Infinite Loops',
        category: 'Safety',
        severity: 'Warning',
        enabled: true,
        description: 'Detect loops that may never terminate.',
    },
    {
        id: 'R003',
        name: 'Unsafe Recursion Patterns',
        category: 'Safety',
        severity: 'Warning',
        enabled: true,
        description: 'Detect recursion without proper base case.',
    },
    {
        id: 'R004',
        name: 'Recursion Depth Risk',
        category: 'Safety',
        severity: 'Warning',
        enabled: true,
        description: 'Estimate risk of stack overflow due to deep recursion.',
    },
    {
        id: 'R005',
        name: 'Expensive Repeated Operations',
        category: 'Performance',
        severity: 'Warning',
        enabled: true,
        description: 'Detect costly operations inside loops.',
    },
    {
        id: 'R006',
        name: 'Constraint-aware TLE Warnings',
        category: 'Performance',
        severity: 'Warning',
        enabled: true,
        description: 'Warn when complexity may exceed time limit.',
    },
    {
        id: 'R007',
        name: 'Missing Return Statement',
        category: 'Correctness',
        severity: 'Info',
        enabled: true,
        description: 'Detect non-void functions without return.',
    },
    {
        id: 'R008',
        name: 'Potential Null Pointer Dereference',
        category: 'Safety',
        severity: 'Warning',
        enabled: false,
        description: 'Detect possible null pointer dereference.',
    },
    {
        id: 'R009',
        name: 'Redundant Code',
        category: 'Style',
        severity: 'Info',
        enabled: false,
        description: 'Detect unreachable or redundant code.',
    },
];

export const DEFAULT_SETTINGS: AppSettings = {
    general: {
        autoSave: true,
        autoSaveDelayMs: 1000,
        fontFamily: 'JetBrains Mono',
        fontSize: 14,
        tabSize: 4,
    },
    rules: DEFAULT_RULES,
    compiler: {
        cStandard: 'gnu11',
        optimizationLevel: '-O2',
        enableAllWarnings: true,
        timeLimitMs: 2000,
        compilers: [
            {
                id: 'builtin-mingw64',
                name: 'MinGW-w64 GCC (Bundled)',
                path: 'toolchains/windows-x86_64/mingw64/bin/gcc.exe',
                version: '16.2.0',
                language: 'C',
                available: true,
                isDefault: true,
                isBuiltIn: true,
            },
        ],
    },
};
