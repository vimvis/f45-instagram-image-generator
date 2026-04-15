// Image Processing Utilities

export const processImageFile = async (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;

                const maxDim = 2048;
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = (height / width) * maxDim;
                        width = maxDim;
                    } else {
                        width = (width / height) * maxDim;
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const base64 = canvas.toDataURL(file.type).split(',')[1];
                resolve({ base64, mimeType: file.type });
            };
            // NOTE: onerror receives an Event object, not an Error — always wrap in Error
            img.onerror = () => reject(new Error(`이미지 로드 실패: ${file.name}`));
            img.src = e.target?.result as string;
        };
        // NOTE: FileReader onerror also receives a ProgressEvent, not an Error — wrap in Error
        reader.onerror = () => reject(new Error(`파일 읽기 실패: ${file.name}`));
        reader.readAsDataURL(file);
    });
};

// Parameters are strictly number (callers should parse before calling)
export const generateCalendarGrid = (year: number, month: number): string => {
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return '';

    const date = new Date(year, month - 1, 1);
    const firstDay = date.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    let grid = `### Calendar Grid (${year}-${month})\n\n`;
    grid += '| Sun | Mon | Tue | Wed | Thu | Fri | Sat |\n';
    grid += '|-----|-----|-----|-----|-----|-----|-----|\n';

    let dayCounter = 1;
    for (let week = 0; week < 6; week++) {
        let row = '|';
        for (let day = 0; day < 7; day++) {
            if ((week === 0 && day < firstDay) || dayCounter > daysInMonth) {
                row += '     |';
            } else {
                row += `  ${dayCounter.toString().padStart(2, ' ')} |`;
                dayCounter++;
            }
        }
        grid += row + '\n';
        if (dayCounter > daysInMonth) break;
    }

    return grid;
};
