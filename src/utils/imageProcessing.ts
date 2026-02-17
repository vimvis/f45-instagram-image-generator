// Image Processing Utilities

export const processImageFile = async (file: File): Promise<{ base64: string, mimeType: string }> => {
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
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const generateCalendarGrid = (month: string, year: string): string => {
    if (!month || !year) return '';

    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const firstDay = date.getDay();
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();

    let grid = '### Calendar Grid\n\n';
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
