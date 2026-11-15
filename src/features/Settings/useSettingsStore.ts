import { load } from '@tauri-apps/plugin-store';
import { AppSettings, DEFAULT_SETTINGS } from './settingsTypes';

const STORE_FILE = 'ccomp_settings.json';
const STORE_KEY = 'app_settings';

export async function loadAppSettings(): Promise<AppSettings> {
    try {
        const store = await load(STORE_FILE, { autoSave: false });
        const saved = await store.get<Partial<AppSettings>>(STORE_KEY);

        if (!saved) {
            return structuredClone(DEFAULT_SETTINGS);
        }

        return {
            general: {
                ...DEFAULT_SETTINGS.general,
                ...(saved.general || {}),
            },
            rules: saved.rules && saved.rules.length > 0
                ? saved.rules
                : structuredClone(DEFAULT_SETTINGS.rules),
            compiler: {
                ...DEFAULT_SETTINGS.compiler,
                ...(saved.compiler || {}),
                compilers: saved.compiler?.compilers && saved.compiler.compilers.length > 0
                    ? saved.compiler.compilers
                    : structuredClone(DEFAULT_SETTINGS.compiler.compilers),
            },
        };
    } catch (error) {
        console.error('Failed to load CComp settings:', error);
        return structuredClone(DEFAULT_SETTINGS);
    }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
    const store = await load(STORE_FILE, { autoSave: false });
    await store.set(STORE_KEY, settings);
    await store.save();

    window.dispatchEvent(
        new CustomEvent('onSettingsUpdated', { detail: settings })
    );
}
