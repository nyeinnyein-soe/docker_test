import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => void
  isLoading?: boolean
}

export default function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  isLoading = false,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  const getIconColor = () => {
    switch (variant) {
      case 'danger':
        return 'bg-destructive/10 text-destructive'
      case 'warning':
        return 'bg-warning/10 text-warning'
      default:
        return 'bg-primary/10 text-primary'
    }
  }

  const getConfirmVariant = () => {
    switch (variant) {
      case 'danger':
        return 'destructive'
      case 'warning':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Close button */}
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </Dialog.Close>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${getIconColor()}`}>
              <AlertTriangle className="w-7 h-7" />
            </div>
          </div>

          {/* Title */}
          <Dialog.Title className="text-xl font-bold text-center mb-2">
            {title}
          </Dialog.Title>

          {/* Description */}
          <Dialog.Description className="text-muted-foreground text-center mb-6">
            {description}
          </Dialog.Description>

          {/* Actions */}
          <div className="flex gap-3">
            <Dialog.Close asChild>
              <Button
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              variant={getConfirmVariant()}
              className="flex-1"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
