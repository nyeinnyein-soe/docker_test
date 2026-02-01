import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit, Trash2, X, Save, Loader2, Layers, Sliders, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import ConfirmModal from '@/components/common/ConfirmModal'
import api from '@/lib/api'
import type { Product, ProductVariant } from '@/types'

interface ModifierGroup {
  id: number
  name: string
  min_select: number
  max_select: number
  modifiers: Modifier[]
}

interface Modifier {
  id: number
  group_id: number
  name: string
  price_extra: string
  cost_extra: string
}

interface ProductManagementModalProps {
  product: Product
  onClose: () => void
  onUpdate: () => void
}

type Tab = 'variants' | 'modifiers'

export default function ProductManagementModal({ product, onClose, onUpdate }: ProductManagementModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('variants')
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || [])
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([])
  const [assignedModifierGroupIds, setAssignedModifierGroupIds] = useState<number[]>([])
  const [isLoadingModifiers, setIsLoadingModifiers] = useState(false)

  // Variant form state
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [variantFormData, setVariantFormData] = useState({
    name: '',
    sku: '',
    price: '',
    cost: '',
  })
  const [isSavingVariant, setIsSavingVariant] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [variantToDelete, setVariantToDelete] = useState<ProductVariant | null>(null)

  useEffect(() => {
    fetchModifierGroups()
    fetchProductModifiers()
  }, [product.id])

  const fetchModifierGroups = async () => {
    setIsLoadingModifiers(true)
    try {
      const response = await api.get('/modifier-groups')
      setModifierGroups(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch modifier groups:', error)
    } finally {
      setIsLoadingModifiers(false)
    }
  }

  const fetchProductModifiers = async () => {
    try {
      const response = await api.get(`/products/${product.id}`)
      const assignedGroups = (response.data.data.modifier_groups || []).map((g: ModifierGroup) => g.id)
      setAssignedModifierGroupIds(assignedGroups)
    } catch (error) {
      console.error('Failed to fetch product modifiers:', error)
    }
  }

  // Variant handlers
  const handleNewVariant = () => {
    setEditingVariant(null)
    setVariantFormData({
      name: '',
      sku: '',
      price: '',
      cost: '',
    })
    setShowVariantForm(true)
  }

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setVariantFormData({
      name: variant.name,
      sku: variant.sku || '',
      price: variant.price,
      cost: variant.cost || '',
    })
    setShowVariantForm(true)
  }

  const handleDeleteVariant = (variant: ProductVariant) => {
    setVariantToDelete(variant)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteVariant = async () => {
    if (!variantToDelete) return

    try {
      await api.delete(`/variants/${variantToDelete.id}`)
      setVariants(variants.filter((v) => v.id !== variantToDelete.id))
      setShowDeleteConfirm(false)
      setVariantToDelete(null)
      onUpdate()
    } catch (error) {
      console.error('Failed to delete variant:', error)
    }
  }

  const handleSaveVariant = async () => {
    if (!variantFormData.name || !variantFormData.price) return

    setIsSavingVariant(true)
    try {
      if (editingVariant) {
        const response = await api.put(`/variants/${editingVariant.id}`, {
          name: variantFormData.name,
          sku: variantFormData.sku || null,
          price: parseFloat(variantFormData.price),
          cost: parseFloat(variantFormData.cost) || 0,
        })
        setVariants(variants.map((v) => (v.id === editingVariant.id ? response.data.data : v)))
      } else {
        const response = await api.post('/variants', {
          product_id: product.id,
          name: variantFormData.name,
          sku: variantFormData.sku || null,
          price: parseFloat(variantFormData.price),
          cost: parseFloat(variantFormData.cost) || 0,
        })
        setVariants([...variants, response.data.data])
      }

      setShowVariantForm(false)
      onUpdate()
    } catch (error) {
      console.error('Failed to save variant:', error)
    } finally {
      setIsSavingVariant(false)
    }
  }

  // Modifier handlers
  const handleToggleModifierGroup = async (groupId: number) => {
    const isAssigned = assignedModifierGroupIds.includes(groupId)
    const newIds = isAssigned
      ? assignedModifierGroupIds.filter((id) => id !== groupId)
      : [...assignedModifierGroupIds, groupId]

    try {
      await api.put(`/products/${product.id}/modifiers`, {
        modifier_group_ids: newIds,
      })
      setAssignedModifierGroupIds(newIds)
      onUpdate()
    } catch (error) {
      console.error('Failed to update product modifiers:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">{product.name}</h2>
            <p className="text-sm text-muted-foreground">Manage variants and modifiers</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('variants')}
            className={cn(
              'flex-1 px-4 py-3 font-medium transition-colors border-b-2',
              activeTab === 'variants'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Layers className="w-4 h-4" />
              Variants ({variants.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('modifiers')}
            className={cn(
              'flex-1 px-4 py-3 font-medium transition-colors border-b-2',
              activeTab === 'modifiers'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Sliders className="w-4 h-4" />
              Modifiers ({assignedModifierGroupIds.length})
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'variants' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Product Variants</h3>
                <Button onClick={handleNewVariant} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variant
                </Button>
              </div>

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
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Modifier Groups</h3>
                <p className="text-sm text-muted-foreground">
                  Select modifier groups available for this product
                </p>
              </div>

              {isLoadingModifiers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : modifierGroups.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <p>No modifier groups available</p>
                  <p className="text-xs mt-2">Create modifier groups in Settings → Modifiers</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {modifierGroups.map((group) => {
                    const isAssigned = assignedModifierGroupIds.includes(group.id)
                    return (
                      <Card
                        key={group.id}
                        className={cn(
                          'p-4 cursor-pointer transition-all',
                          isAssigned && 'border-primary bg-primary/5'
                        )}
                        onClick={() => handleToggleModifierGroup(group.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {isAssigned && (
                                <Check className="w-5 h-5 text-primary" />
                              )}
                              <span className="font-medium">{group.name}</span>
                              {isAssigned && (
                                <Badge variant="secondary" className="text-xs">Assigned</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {group.modifiers?.length || 0} modifier(s) • Select {group.min_select}-
                              {group.max_select}
                            </p>
                          </div>
                          <div className="ml-4">
                            {isAssigned ? (
                              <Badge className="bg-primary">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Variant Form Modal */}
        {showVariantForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <Card className="w-full max-w-md">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">
                    {editingVariant ? 'Edit Variant' : 'New Variant'}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowVariantForm(false)}>
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
                    value={variantFormData.name}
                    onChange={(e) => setVariantFormData({ ...variantFormData, name: e.target.value })}
                    placeholder="e.g., Small, Large, Red"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">SKU (Optional)</label>
                  <Input
                    value={variantFormData.sku}
                    onChange={(e) => setVariantFormData({ ...variantFormData, sku: e.target.value })}
                    placeholder="Stock keeping unit"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Price</label>
                    <Input
                      type="number"
                      value={variantFormData.price}
                      onChange={(e) => setVariantFormData({ ...variantFormData, price: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cost</label>
                    <Input
                      type="number"
                      value={variantFormData.cost}
                      onChange={(e) => setVariantFormData({ ...variantFormData, cost: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowVariantForm(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveVariant}
                  disabled={isSavingVariant || !variantFormData.name || !variantFormData.price}
                >
                  {isSavingVariant ? (
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

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={showDeleteConfirm}
          onOpenChange={(open) => {
            setShowDeleteConfirm(open)
            if (!open) setVariantToDelete(null)
          }}
          title="Delete Variant"
          description={`Are you sure you want to delete variant "${variantToDelete?.name}"?`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={confirmDeleteVariant}
        />
      </Card>
    </div>
  )
}
