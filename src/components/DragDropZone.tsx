import React, { useState, useRef } from 'react';

interface DragDropZoneProps {
    onFileSelected: (file: File) => void;
    label: string;
    hasFile: boolean;
    icon?: string;
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({ onFileSelected, label, hasFile, icon = 'fa-file' }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            onFileSelected(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelected(file);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${isDragging
                    ? 'border-[#EE3124] bg-[#EE3124]/10 scale-105'
                    : hasFile
                        ? 'border-[#EE3124] bg-[#EE3124]/5'
                        : 'border-[#EE3124]/30 hover:border-[#EE3124]/50 hover:bg-[#1a0f3f]'
                }`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
            <i className={`fas ${icon} text-2xl mb-2 ${hasFile ? 'text-[#EE3124]' : 'text-gray-400'}`}></i>
            <p className={`text-xs font-semibold ${hasFile ? 'text-[#EE3124]' : 'text-gray-400'}`}>{label}</p>
        </div>
    );
};
