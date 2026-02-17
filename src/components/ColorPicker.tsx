import React, { useState } from 'react';
import type { BrandColors } from '@/src/types';

interface ColorPickerProps {
    colors: BrandColors;
    onChange: (colors: BrandColors) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ colors, onChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="mb-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 bg-[#1a0f3f] border border-[#EE3124]/30 rounded-lg hover:bg-[#251560] transition-colors"
            >
                <span className="text-xs font-bold text-gray-300">🎨 Brand Colors</span>
                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[#EE3124] text-xs`}></i>
            </button>

            {isExpanded && (
                <div className="mt-3 p-4 bg-[#1a0f3f]/50 border border-[#EE3124]/20 rounded-lg space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Primary Color</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={colors.primary}
                                onChange={(e) => onChange({ ...colors, primary: e.target.value })}
                                className="w-12 h-10 rounded cursor-pointer border-2 border-[#EE3124]/50"
                            />
                            <input
                                type="text"
                                value={colors.primary}
                                onChange={(e) => onChange({ ...colors, primary: e.target.value })}
                                className="flex-1 bg-[#1a0f3f] border border-[#EE3124]/30 rounded px-3 py-2 text-sm font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Secondary Color</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={colors.secondary}
                                onChange={(e) => onChange({ ...colors, secondary: e.target.value })}
                                className="w-12 h-10 rounded cursor-pointer border-2 border-[#EE3124]/50"
                            />
                            <input
                                type="text"
                                value={colors.secondary}
                                onChange={(e) => onChange({ ...colors, secondary: e.target.value })}
                                className="flex-1 bg-[#1a0f3f] border border-[#EE3124]/30 rounded px-3 py-2 text-sm font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Text Color</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={colors.textColor}
                                onChange={(e) => onChange({ ...colors, textColor: e.target.value })}
                                className="w-12 h-10 rounded cursor-pointer border-2 border-[#EE3124]/50"
                            />
                            <input
                                type="text"
                                value={colors.textColor}
                                onChange={(e) => onChange({ ...colors, textColor: e.target.value })}
                                className="flex-1 bg-[#1a0f3f] border border-[#EE3124]/30 rounded px-3 py-2 text-sm font-mono"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
