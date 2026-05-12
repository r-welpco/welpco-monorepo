import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface PersonalizationState {
  themeMode: ThemeMode;
  translucentTheme: boolean;
  backgroundId: string;
  shapeId: string;
  setThemeMode: (mode: ThemeMode) => void;
  setTranslucentTheme: (enabled: boolean) => void;
  setBackground: (backgroundId: string) => void;
  setShape: (shapeId: string) => void;
  reset: () => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'welpco-personalization';
const STORAGE_VERSION = 1;

const defaultState = {
  themeMode: 'system' as ThemeMode,
  translucentTheme: true,
  backgroundId: 'default',
  shapeId: 'parallel-lines',
};

type PersistedState = Pick<PersonalizationState, 'themeMode' | 'translucentTheme' | 'backgroundId' | 'shapeId'>;

const loadFromStorage = (): Partial<PersistedState> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { version?: number } & Partial<PersistedState>;
    const version = parsed.version ?? 0;
    if (version < STORAGE_VERSION) {
      // Migrate or drop old schema: merge with defaults, keep only known keys
      return {
        themeMode: defaultState.themeMode,
        translucentTheme: defaultState.translucentTheme,
        backgroundId: defaultState.backgroundId,
        shapeId: defaultState.shapeId,
        ...(typeof parsed.themeMode === 'string' && ['light', 'dark', 'system'].includes(parsed.themeMode) && { themeMode: parsed.themeMode as ThemeMode }),
        ...(typeof parsed.translucentTheme === 'boolean' && { translucentTheme: parsed.translucentTheme }),
        ...(typeof parsed.backgroundId === 'string' && { backgroundId: parsed.backgroundId }),
        ...(typeof parsed.shapeId === 'string' && { shapeId: parsed.shapeId }),
      };
    }
    return {
      themeMode: parsed.themeMode ?? defaultState.themeMode,
      translucentTheme: parsed.translucentTheme ?? defaultState.translucentTheme,
      backgroundId: parsed.backgroundId ?? defaultState.backgroundId,
      shapeId: parsed.shapeId ?? defaultState.shapeId,
    };
  } catch (error) {
    console.error('Failed to load personalization from storage:', error);
  }
  return {};
};

const saveToStorage = (state: PersonalizationState) => {
  if (typeof window === 'undefined') return;
  try {
    const { setThemeMode, setTranslucentTheme, setBackground, setShape, reset, loadFromStorage, saveToStorage, ...persistedState } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, ...persistedState }));
  } catch (error) {
    console.error('Failed to save personalization to storage:', error);
  }
};

export const usePersonalizationStore = create<PersonalizationState>((set, get) => {
  const stored = loadFromStorage();
  const initialState = { ...defaultState, ...stored };

  return {
    ...initialState,
    setThemeMode: (mode) => {
      set({ themeMode: mode });
      saveToStorage(get());
    },
    setTranslucentTheme: (enabled) => {
      set({ translucentTheme: enabled });
      saveToStorage(get());
    },
    setBackground: (backgroundId) => {
      set({ backgroundId });
      saveToStorage(get());
    },
    setShape: (shapeId) => {
      set({ shapeId });
      saveToStorage(get());
    },
    reset: () => {
      set(defaultState);
      saveToStorage({ ...defaultState, setThemeMode: get().setThemeMode, setTranslucentTheme: get().setTranslucentTheme, setBackground: get().setBackground, setShape: get().setShape, reset: get().reset, loadFromStorage: get().loadFromStorage, saveToStorage: get().saveToStorage });
    },
    loadFromStorage: () => {
      const stored = loadFromStorage();
      set({ ...defaultState, ...stored });
    },
    saveToStorage: () => {
      saveToStorage(get());
    },
  };
});

