import type { LazyComponent } from '../dialogs';

export const SettingsLazyDialog: LazyComponent = () => import('./Settings.svelte');
