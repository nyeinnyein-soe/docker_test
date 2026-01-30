import { Button } from '@/components/ui/button'
import { Delete } from 'lucide-react'

interface NumPadProps {
  onInput: (value: string) => void
  onClear: () => void
  onBackspace: () => void
  onEnter?: () => void
  showDecimal?: boolean
  enterLabel?: string
}

export default function NumPad({
  onInput,
  onClear,
  onBackspace,
  onEnter,
  showDecimal = false,
  enterLabel = 'Enter',
}: NumPadProps) {
  const keys = showDecimal
    ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back']
    : ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'back']

  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((key) => (
        <Button
          key={key}
          type="button"
          variant={key === 'C' ? 'destructive' : 'secondary'}
          size="lg"
          className="h-14 text-xl font-semibold"
          onClick={() => {
            if (key === 'C') onClear()
            else if (key === 'back') onBackspace()
            else onInput(key)
          }}
        >
          {key === 'back' ? <Delete className="w-6 h-6" /> : key}
        </Button>
      ))}
      {onEnter && (
        <Button
          type="button"
          className="col-span-3 h-14 text-lg font-semibold"
          onClick={onEnter}
        >
          {enterLabel}
        </Button>
      )}
    </div>
  )
}
