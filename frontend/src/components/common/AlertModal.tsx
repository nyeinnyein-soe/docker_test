import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

interface AlertModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  variant?: 'error' | 'success' | 'info'
  buttonLabel?: string
}

export default function AlertModal({
  open,
  onOpenChange,
  title,
  message,
  variant = 'info',
  buttonLabel = 'OK',
}: AlertModalProps) {
  const getIconAndColor = () => {
    switch (variant) {
      case 'error':
        return {
          icon: AlertCircle,
          color: 'bg-destructive/10 text-destructive',
        }
      case 'success':
        return {
          icon: CheckCircle,
          color: 'bg-success/10 text-success',
        }
      default:
        return {
          icon: Info,
          color: 'bg-primary/10 text-primary',
        }
    }
  }

  const { icon: Icon, color } = getIconAndColor()

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
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
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}>
              <Icon className="w-7 h-7" />
            </div>
          </div>

          {/* Title */}
          <Dialog.Title className="text-xl font-bold text-center mb-2">
            {title}
          </Dialog.Title>

          {/* Message */}
          <Dialog.Description className="text-muted-foreground text-center mb-6">
            {message}
          </Dialog.Description>

          {/* Action */}
          <Dialog.Close asChild>
            <Button className="w-full">
              {buttonLabel}
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
