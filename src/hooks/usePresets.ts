import { useState, useEffect } from 'react';
import type { Preset } from '@/src/types';
import { get, set } from 'idb-keyval';

const STORAGE_KEY = 'f45_presets';

export const usePresets = () => {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPresets();
    }, []);

    const loadPresets = async () => {
        try {
            const stored = await get(STORAGE_KEY);
            if (stored && Array.isArray(stored)) {
                setPresets(stored);
            }
        } catch (e) {
            console.error('Failed to load presets:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const savePreset = async (preset: Omit<Preset, 'id' | 'createdAt'>) => {
        const newPreset: Preset = {
            ...preset,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString()
        };

        const updated = [...presets, newPreset];
        setPresets(updated);
        await set(STORAGE_KEY, updated);
        return newPreset;
    };

    const deletePreset = async (id: string) => {
        const updated = presets.filter(p => p.id !== id);
        setPresets(updated);
        await set(STORAGE_KEY, updated);
    };

    const loadPresetById = (id: string) => {
        return presets.find(p => p.id === id);
    };

    return {
        presets,
        isLoading,
        loadPresets,
        savePreset,
        deletePreset,
        loadPresetById
    };
};
