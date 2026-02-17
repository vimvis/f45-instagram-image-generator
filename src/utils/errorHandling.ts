// Error Handling Utilities

export enum ErrorType {
    API_KEY = 'API_KEY',
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
    const errorMessage = err?.message || err?.toString() || 'Unknown error';

    // API Key errors
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
        return {
            type: ErrorType.API_KEY,
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
