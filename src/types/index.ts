// Type Definitions — aligned with actual runtime usage

export type AspectRatio = '1:1' | '4:5' | '9:16';
export type BgTheme = 'dark' | 'light' | 'vibrant';
export type MobileTab = 'editor' | 'gallery';
// top-center / bottom-center included to match LogoPosition usage in index.tsx
export type LogoPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

export interface FieldConfig {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'date';
    placeholder?: string;
}

export interface Template {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    color: string;
    fields: FieldConfig[];
    // NOTE: field name is 'promptBase' (not 'basePrompt')
    promptBase: string;
}

export interface SavedImage {
    id: string;
    // NOTE: field name is 'data' (base64 data URL), not 'url'
    data: string;
    // NOTE: stored as ISO string, not number
    timestamp: string;
    templateId?: string;
}

export interface BrandColors {
    primary: string;
    secondary: string;
    textColor: string;
}

export interface Preset {
    id: string;
    name: string;
    createdAt: string;
    templateId: string | null;
    formValues: Record<string, string>;
    aspectRatio: AspectRatio;
    bgTheme: BgTheme;
    bgOpacity: number;
    brandColors?: BrandColors;
    logoSize?: number;
}
