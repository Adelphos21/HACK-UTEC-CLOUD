import React from 'react';
import ToastNotification from './ToastNotification';
import type { Notification } from '../hooks/useWebSocket';

interface ToastContainerProps {
  toasts: Notification[];
  onRemoveToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemoveToast }) => {
  return (
    <div className="fixed top-0 right-0 z-[9999] pointer-events-none">
      <div className="flex flex-col gap-2 p-4">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              transform: `translateY(${index * 10}px)`,
              transition: 'transform 0.3s ease'
            }}
          >
            <ToastNotification
              notification={toast}
              onClose={() => onRemoveToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;