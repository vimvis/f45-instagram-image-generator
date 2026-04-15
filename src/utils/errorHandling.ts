// Error Handling Utilities

export enum ErrorType {
    // NOTE: renamed from API_KEY → API_KEY_INVALID to match usage in index.tsx
    API_KEY_INVALID = 'API_KEY_INVALID',
    QUOTA = 'QUOTA',
    NETWORK = 'NETWORK',
    INVALID_INPUT = 'INVALID_INPUT',
    GENERATION = 'GENERATION',
    UNKNOWN = 'UNKNOWN'
}

interface ParsedError {
    type: ErrorType;
    title: string;
    message: string;
    solution: string;
}

export const parseError = (err: any): ParsedError => {
    // Guard: if a DOM Event was accidentally thrown, extract a meaningful message
    if (err instanceof Event) {
        return {
            type: ErrorType.UNKNOWN,
            title: '❌ 예기치 않은 오류',
            message: '파일 처리 중 오류가 발생했습니다.',
            solution: '파일 형식을 확인하고 다시 시도해주세요.'
        };
    }

    const errorMessage = err?.message || err?.toString() || 'Unknown error';

    // API Key errors
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
        return {
            type: ErrorType.API_KEY_INVALID,
            title: '🔑 Invalid API Key',
            message: 'Your Google Gemini API key is invalid or expired.',
            solution: 'Please check your API key and try connecting again.'
        };
    }

    // Quota errors
    if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        return {
            type: ErrorType.QUOTA,
            title: '📊 Quota Exceeded',
            message: 'You\'ve reached your API quota limit.',
            solution: 'Check your Google Cloud billing or wait for quota reset.'
        };
    }

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('Failed to fetch') || !navigator.onLine) {
        return {
            type: ErrorType.NETWORK,
            title: '🌐 Network Error',
            message: 'Unable to connect to the API.',
            solution: 'Check your internet connection and try again.'
        };
    }

    // Invalid input
    if (errorMessage.includes('invalid') || errorMessage.includes('missing')) {
        return {
            type: ErrorType.INVALID_INPUT,
            title: '⚠️ Invalid Input',
            message: 'Some required fields are missing or invalid.',
            solution: 'Please fill in all required fields and try again.'
        };
    }

    // Generation errors
    if (errorMessage.includes('generation') || errorMessage.includes('SAFETY')) {
        return {
            type: ErrorType.GENERATION,
            title: '🚫 Generation Failed',
            message: 'The AI couldn\'t generate the image.',
            solution: 'Try adjusting your prompt or using different content.'
        };
    }

    // Unknown errors
    return {
        type: ErrorType.UNKNOWN,
        title: '❌ Error',
        message: errorMessage.substring(0, 100),
        solution: 'Please try again or contact support if the issue persists.'
    };
};
