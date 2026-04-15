// Image Processing Utilities

// Preferred output format when canvas resize is used
const OUTPUT_MIME = 'image/jpeg';
const OUTPUT_QUALITY = 0.92;

export const processImageFile = async (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (!dataUrl) {
                reject(new Error(`파일을 읽을 수 없습니다: ${file.name}`));
                return;
            }

            const img = new Image();

            img.onload = () => {
                // Guard: degenerate image dimensions
                if (img.width === 0 || img.height === 0) {
                    // Fallback to raw base64 (e.g. SVG without explicit dimensions)
                    const base64 = dataUrl.split(',')[1];
                    resolve({ base64, mimeType: file.type || OUTPUT_MIME });
                    return;
                }

                // Guard: 2D context may be null in memory-limited environments
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    // Fallback to raw base64
                    const base64 = dataUrl.split(',')[1];
                    resolve({ base64, mimeType: file.type || OUTPUT_MIME });
                    return;
                }

                const maxDim = 2048;
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height / width) * maxDim);
                        width = maxDim;
                    } else {
                        width = Math.round((width / height) * maxDim);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Always output JPEG for consistent mimeType
                // (HEIC, WebP, AVIF not reliably supported by canvas.toDataURL)
                const base64 = canvas.toDataURL(OUTPUT_MIME, OUTPUT_QUALITY).split(',')[1];
                resolve({ base64, mimeType: OUTPUT_MIME });
            };

            // Fallback: browser cannot render this image format (e.g. HEIC on Chrome)
            // Send raw base64 — the Gemini API supports more formats than HTMLImageElement
            img.onerror = () => {
                const base64 = dataUrl.split(',')[1];
                if (base64) {
                    console.warn(`Canvas 렌더링 불가 (${file.type}), raw base64로 대체: ${file.name}`);
                    resolve({ base64, mimeType: file.type || OUTPUT_MIME });
                } else {
                    reject(new Error(`지원하지 않는 이미지 형식입니다: ${file.name}`));
                }
            };

            img.src = dataUrl;
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
