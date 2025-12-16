import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message: string;
    createdBy?: string;
    duration?: number;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    clearAll: () => void;
}

// Sound URLs (using Web Audio API for reliability)
const playSound = (type: ToastType) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Different sounds for different types
        switch (type) {
            case 'success':
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
                oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case 'error':
                oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3
                oscillator.frequency.setValueAtTime(196, audioContext.currentTime + 0.15); // G3
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
                break;
            case 'warning':
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
            case 'info':
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
                break;
        }
    } catch (e) {
        // Silently fail if audio is not available
    }
};

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast = { ...toast, id, duration: toast.duration ?? 5000 };

        // Play sound
        playSound(toast.type);

        set((state) => ({
            toasts: [...state.toasts, newToast],
        }));

        // Auto remove after duration
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        }, newToast.duration);
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
    clearAll: () => set({ toasts: [] }),
}));

// Helper functions for common notifications
export const showSuccessToast = (title: string, message: string, createdBy?: string) => {
    useToastStore.getState().addToast({ type: 'success', title, message, createdBy });
};

export const showErrorToast = (title: string, message: string) => {
    useToastStore.getState().addToast({ type: 'error', title, message, duration: 8000 });
};

export const showInfoToast = (title: string, message: string) => {
    useToastStore.getState().addToast({ type: 'info', title, message });
};

export const showWarningToast = (title: string, message: string) => {
    useToastStore.getState().addToast({ type: 'warning', title, message });
};
