import toast, { Toaster } from 'react-hot-toast';

export const ToastProvider = () => {
    return (
        <Toaster
            position="top-right"
            toastOptions={{
                success: {
                    style: {
                        background: '#1a0f3f',
                        color: '#ffffff',
                        border: '2px solid #EE3124',
                    },
                    iconTheme: {
                        primary: '#EE3124',
                        secondary: '#ffffff',
                    },
                },
                error: {
                    style: {
                        background: '#7f1d1d',
                        color: '#ffffff',
                        border: '2px solid #dc2626',
                    },
                    iconTheme: {
                        primary: '#dc2626',
                        secondary: '#ffffff',
                    },
                },
            }}
        />
    );
};
