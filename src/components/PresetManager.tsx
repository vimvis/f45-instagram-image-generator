import React, { useState } from 'react';
import type { Preset, BrandColors, AspectRatio, BgTheme } from '@/src/types';
import { get, set } from 'idb-keyval';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'f45_presets';

// Shape of what the parent passes as current settings for saving
interface CurrentSettings {
    templateId: string | null;
    formValues: Record<string, string>;
    aspectRatio: AspectRatio;
    bgTheme: BgTheme;
    bgOpacity: number;
    brandColors: BrandColors;
    logoSize: number;
}

interface PresetManagerProps {
    currentSettings: CurrentSettings;
    onLoadPreset: (preset: Preset) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({ currentSettings, onLoadPreset }) => {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveNameInput, setSaveNameInput] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);

    const loadPresets = async () => {
        try {
            const stored = await get(STORAGE_KEY);
            if (stored && Array.isArray(stored)) {
                setPresets(stored);
            }
        } catch (e) {
            console.error('Failed to load presets:', e);
        }
    };

    const handleToggle = async () => {
        if (!isExpanded) {
            setIsLoading(true);
            await loadPresets();
            setIsLoading(false);
        }
        setIsExpanded(!isExpanded);
    };

    const handleSave = async () => {
        const name = saveNameInput.trim();
        if (!name) {
            toast.error('프리셋 이름을 입력해주세요');
            return;
        }
        setIsSaving(true);
        try {
            const newPreset: Preset = {
                id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
                name,
                createdAt: new Date().toISOString(),
                templateId: currentSettings.templateId,
                formValues: currentSettings.formValues,
                aspectRatio: currentSettings.aspectRatio,
                bgTheme: currentSettings.bgTheme,
                bgOpacity: currentSettings.bgOpacity,
                brandColors: currentSettings.brandColors,
                logoSize: currentSettings.logoSize,
            };
            const updated = [...presets, newPreset];
            await set(STORAGE_KEY, updated);
            setPresets(updated);
            setSaveNameInput('');
            setShowSaveInput(false);
            toast.success(`💾 "${name}" 저장됨`);
        } catch (e) {
            toast.error('저장 실패');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const updated = presets.filter(p => p.id !== id);
        await set(STORAGE_KEY, updated);
        setPresets(updated);
        toast.success('Preset deleted');
    };

    return (
        <div className="mb-4">
            <div className="flex gap-2">
                <button
                    onClick={handleToggle}
                    className="flex-1 flex items-center justify-between p-3 bg-[#1a0f3f] border border-[#EE3124]/30 rounded-lg hover:bg-[#251560] transition-colors"
                >
                    <span className="text-xs font-bold text-gray-300">💾 Saved Presets</span>
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[#EE3124] text-xs`}></i>
                </button>
                <button
                    onClick={() => setShowSaveInput(!showSaveInput)}
                    title="현재 설정 저장"
                    className="px-3 py-2 bg-[#EE3124]/20 border border-[#EE3124]/40 rounded-lg hover:bg-[#EE3124]/30 transition-colors text-[#EE3124] text-xs font-bold"
                >
                    <i className="fas fa-plus"></i>
                </button>
            </div>

            {/* Save input row */}
            {showSaveInput && (
                <div className="mt-2 flex gap-2">
                    <input
                        type="text"
                        value={saveNameInput}
                        onChange={(e) => setSaveNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        placeholder="프리셋 이름 입력 후 Enter"
                        className="flex-1 bg-[#1a0f3f] border border-[#EE3124]/40 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#EE3124] transition-colors"
                        autoFocus
                    />
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-3 py-2 bg-[#EE3124] text-white rounded-lg text-xs font-bold hover:bg-[#cc2920] disabled:opacity-50 transition-colors"
                    >
                        {isSaving ? <i className="fas fa-spinner fa-spin"></i> : '저장'}
                    </button>
                </div>
            )}

            {isExpanded && (
                <div className="mt-3 p-4 bg-[#1a0f3f]/50 border border-[#EE3124]/20 rounded-lg">
                    {isLoading ? (
                        <p className="text-xs text-gray-500 text-center py-2">
                            <i className="fas fa-spinner fa-spin mr-2"></i>Loading...
                        </p>
                    ) : presets.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-2">저장된 프리셋 없음 — + 버튼으로 현재 설정을 저장하세요</p>
                    ) : (
                        <div className="space-y-2">
                            {presets.map(preset => (
                                <div key={preset.id} className="flex items-center gap-2 p-2 bg-[#1a0f3f] rounded-lg group">
                                    <button
                                        onClick={() => {
                                            onLoadPreset(preset);
                                            toast.success(`Loaded "${preset.name}"`);
                                        }}
                                        className="flex-1 text-left text-xs font-semibold text-gray-300 hover:text-[#EE3124] truncate"
                                    >
                                        {preset.name}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(preset.id)}
                                        className="px-2 py-1 text-xs text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
