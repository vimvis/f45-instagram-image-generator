import React, { useState } from 'react';
import type { Preset } from '@/src/types';
import { get, set } from 'idb-keyval';
import toast from 'react-hot-toast';

interface PresetManagerProps {
    onLoadPreset: (preset: Preset) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({ onLoadPreset }) => {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const loadPresets = async () => {
        try {
            const stored = await get('f45_presets');
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

    const handleDelete = async (id: string) => {
        const updated = presets.filter(p => p.id !== id);
        await set('f45_presets', updated);
        setPresets(updated);
        toast.success('Preset deleted');
    };

    return (
        <div className="mb-4">
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between p-3 bg-[#1a0f3f] border border-[#EE3124]/30 rounded-lg hover:bg-[#251560] transition-colors"
            >
                <span className="text-xs font-bold text-gray-300">💾 Saved Presets</span>
                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[#EE3124] text-xs`}></i>
            </button>

            {isExpanded && (
                <div className="mt-3 p-4 bg-[#1a0f3f]/50 border border-[#EE3124]/20 rounded-lg">
                    {isLoading ? (
                        <p className="text-xs text-gray-500 text-center py-2">
                            <i className="fas fa-spinner fa-spin mr-2"></i>Loading...
                        </p>
                    ) : presets.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-2">No saved presets</p>
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
