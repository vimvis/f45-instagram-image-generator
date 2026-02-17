// Type Definitions
export type AspectRatio = '1:1' | '4:5' | '9:16';
export type BgTheme = 'dark' | 'light' | 'vibrant';
export type MobileTab = 'editor' | 'gallery';
export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

export interface Template {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    fields: FieldConfig[];
    basePrompt: string;
}

export interface FieldConfig {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'date';
    placeholder?: string;
}

export interface SavedImage {
    id: string;
    url: string;
    timestamp: number;
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
