import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { X, Plus, Minus, Check } from 'lucide-react'
import type { Product, ProductVariant, Modifier, ModifierGroup } from '@/types'

interface ModifierModalProps {
  product: Product
  modifierGroups: ModifierGroup[]
  onClose: () => void
  onAdd: (variant: ProductVariant, modifiers: Modifier[], quantity: number, notes: string) => void
}

export default function ModifierModal({
  product,
  modifierGroups,
  onClose,
  onAdd,
}: ModifierModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants.find((v) => v.is_default) || product.variants[0]
  )
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([])
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const toggleModifier = (modifier: Modifier, group: ModifierGroup) => {
    setSelectedModifiers((prev) => {
      const isSelected = prev.some((m) => Number(m.id) === Number(modifier.id))
      
      if (isSelected) {
        return prev.filter((m) => Number(m.id) !== Number(modifier.id))
      } else {
        // Check max_select limit for this group
        const groupModifiers = prev.filter((m) =>
          group.modifiers.some((gm) => Number(gm.id) === Number(m.id))
        )
        if (group.max_select > 0 && groupModifiers.length >= group.max_select) {
          if (group.max_select === 1) {
            // For single select, replace the current one
            const newModifiers = prev.filter(
              (m) => !group.modifiers.some((gm) => Number(gm.id) === Number(m.id))
            )
            return [...newModifiers, modifier]
          }
          // For multi-select, don't allow more than max_select
          return prev
        } else {
          return [...prev, modifier]
        }
      }
    })
  }

  const calculateTotal = () => {
    const basePrice = parseFloat(String(selectedVariant.price)) || 0
    const modifiersPrice = selectedModifiers.reduce(
      (sum, m) => sum + (parseFloat(String(m.price_extra)) || 0),
      0
    )
    return (basePrice + modifiersPrice) * quantity
  }

  const handleAdd = () => {
    onAdd(selectedVariant, selectedModifiers, quantity, notes)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">{product.name}</h2>
            <p className="text-sm text-muted-foreground">{product.description}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Variants */}
          {product.variants.length > 1 && (
            <div>
              <h3 className="font-semibold mb-2">Size</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedVariant.id === variant.id
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:border-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{variant.name}</span>
                      {selectedVariant.id === variant.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(variant.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modifier Groups */}
          {modifierGroups.map((group) => (
            <div key={group.id}>
              <h3 className="font-semibold mb-2">
                {group.name}
                {group.max_select > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (Select up to {group.max_select})
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {group.modifiers.map((modifier) => {
                  const isSelected = selectedModifiers.some((m) => Number(m.id) === Number(modifier.id))
                  return (
                    <button
                      key={modifier.id}
                      type="button"
                      onClick={() => toggleModifier(modifier, group)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all flex justify-between items-center ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-input hover:border-primary/50'
                      }`}
                    >
                      <span>{modifier.name}</span>
                      <div className="flex items-center gap-2">
                        {parseFloat(modifier.price_extra) > 0 && (
                          <span className="text-sm text-muted-foreground">
                            +{formatCurrency(modifier.price_extra)}
                          </span>
                        )}
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Notes */}
          <div>
            <h3 className="font-semibold mb-2">Special Instructions</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              className="w-full p-3 rounded-lg border border-input resize-none h-20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 space-y-3">
          {/* Quantity */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-xl font-bold w-12 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <Button size="lg" className="w-full" onClick={handleAdd}>
            Add to Cart - {formatCurrency(calculateTotal())}
          </Button>
        </div>
      </Card>
    </div>
  )
}
