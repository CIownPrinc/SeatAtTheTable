// LEGAL: window.storage is an optional host-provided persistence bridge. The save
// LEGAL: adapter feature-detects it and falls back to localStorage when absent.
interface Window {
  storage?: {
    set(key: string, value: string, sync?: boolean): Promise<void>;
    get(key: string, sync?: boolean): Promise<{ value: string } | null>;
    delete(key: string, sync?: boolean): Promise<void>;
  };
}
