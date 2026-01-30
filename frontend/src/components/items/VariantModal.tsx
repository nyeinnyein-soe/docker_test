import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit, Trash2, X, Save, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import type { Product, ProductVariant } from '@/types'

interface VariantModalProps {
  product: Product
  onClose: () => void
  onUpdate: () => void
}

export default function VariantModal({ product, onClose, onUpdate }: VariantModalProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || [])
  const [showForm, setShowForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    cost: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleNewVariant = () => {
    setEditingVariant(null)
    setFormData({
      name: '',
      sku: '',
      price: '',
      cost: '',
    })
    setShowForm(true)
  }

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setFormData({
      name: variant.name,
      sku: variant.sku || '',
      price: variant.price,
      cost: variant.cost || '',
    })
    setShowForm(true)
  }

  const handleDeleteVariant = async (variant: ProductVariant) => {
    if (!confirm(`Delete variant "${variant.name}"?`)) return

    try {
      await api.delete(`/variants/${variant.id}`)
      setVariants(variants.filter((v) => v.id !== variant.id))
      onUpdate()
    } catch (error) {
      console.error('Failed to delete variant:', error)
    }
  }

  const handleSaveVariant = async () => {
    if (!formData.name || !formData.price) return

    setIsSaving(true)
    try {
      if (editingVariant) {
        const response = await api.put(`/variants/${editingVariant.id}`, {
          name: formData.name,
          sku: formData.sku || null,
          price: parseFloat(formData.price),
          cost: parseFloat(formData.cost) || 0,
        })
        setVariants(variants.map((v) => (v.id === editingVariant.id ? response.data.data : v)))
      } else {
        const response = await api.post('/variants', {
          product_id: product.id,
          name: formData.name,
          sku: formData.sku || null,
          price: parseFloat(formData.price),
          cost: parseFloat(formData.cost) || 0,
        })
        setVariants([...variants, response.data.data])
      }

      setShowForm(false)
      onUpdate()
    } catch (error) {
      console.error('Failed to save variant:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">Variants - {product.name}</h2>
            <p className="text-sm text-muted-foreground">{variants.length} variant(s)</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNewVariant} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Variant
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Variants List */}
        <div className="flex-1 overflow-y-auto p-4">
          {variants.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>No variants</p>
              <Button variant="link" onClick={handleNewVariant}>
                Add your first variant
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{variant.name}</span>
                      {variant.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    {variant.sku && (
                      <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>
                    )}
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-semibold">{formatCurrency(variant.price)}</p>
                    {parseFloat(variant.cost) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Cost: {formatCurrency(variant.cost)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditVariant(variant)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeleteVariant(variant)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variant Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <Card className="w-full max-w-md">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">
                    {editingVariant ? 'Edit Variant' : 'New Variant'}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">For product:</span>
                  <Badge variant="secondary" className="font-medium">
                    {product.name}
                  </Badge>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium">Variant Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Small, Large, Red"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">SKU (Optional)</label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Stock keeping unit"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Price</label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cost</label>
                    <Input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveVariant}
                  disabled={isSaving || !formData.name || !formData.price}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  )
}
