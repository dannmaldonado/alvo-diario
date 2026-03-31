import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  className,
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEsc) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'animate-fade-in'
      )}
      aria-modal='true'
      role='dialog'
    >
      {/* Backdrop with blur effect */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-sm',
          'animate-fade-in'
        )}
        onClick={() => closeOnBackdropClick && onClose()}
        aria-hidden='true'
      />

      {/* Modal content with scale-in animation */}
      <div
        className={cn(
          'relative w-full mx-4 rounded-lg border border-border',
          'bg-background shadow-lg',
          'overflow-hidden animate-scale-in',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description) && (
          <div className='border-b border-border px-6 py-4 space-y-1'>
            {title && (
              <h2 className='text-lg font-semibold text-foreground animate-slide-up'>
                {title}
              </h2>
            )}
            {description && (
              <p className='text-sm text-muted-foreground animate-slide-up'>
                {description}
              </p>
            )}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className={cn(
            'absolute top-4 right-4 p-1 rounded-md',
            'text-muted-foreground hover:text-foreground hover:bg-accent',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-ring'
          )}
          aria-label='Close modal'
        >
          <X className='h-4 w-4' />
        </button>

        {/* Body */}
        {children && (
          <div className={cn('px-6 py-4 animate-slide-up')}>
            {children}
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className={cn(
            'border-t border-border px-6 py-4 bg-muted/50',
            'animate-slide-down'
          )}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Confirmation dialog - special modal for confirmations
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false,
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size='sm'>
      <div className='space-y-4'>
        <p className='text-sm text-foreground'>{message}</p>

        <div className='flex gap-3 justify-end pt-4'>
          <button
            onClick={onCancel}
            disabled={isLoading || isConfirming}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium',
              'border border-input text-foreground',
              'hover:bg-accent transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            disabled={isLoading || isConfirming}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium',
              'text-white transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isDangerous
                ? 'bg-destructive hover:bg-destructive/90'
                : 'bg-primary hover:bg-primary/90'
            )}
          >
            {isConfirming || isLoading ? (
              <span className='flex items-center gap-2'>
                <span className='h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin' />
                {confirmText}
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
