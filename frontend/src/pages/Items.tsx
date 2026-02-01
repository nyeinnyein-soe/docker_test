import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, cn } from '@/lib/utils'
import { Search, Plus, Edit, Trash2, X, Save, Loader2, Layers, FolderTree, Sliders, Check } from 'lucide-react'
import ConfirmModal from '@/components/common/ConfirmModal'
import AlertModal from '@/components/common/AlertModal'
import api from '@/lib/api'
import type { Category, Product, ProductVariant } from '@/types'

interface ProductFormData {
  name: string
  description: string
  category_id: number | null
  is_taxable: boolean
  price: string
  cost: string
}

export default function Items() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category_id: null,
    price: '',
    cost: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'variants' | 'modifiers'>('basic')
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([])
  const [modifierGroups, setModifierGroups] = useState<any[]>([])
  const [assignedModifierGroupIds, setAssignedModifierGroupIds] = useState<number[]>([])
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [variantFormData, setVariantFormData] = useState({
    name: '',
    sku: '',
    price: '',
    cost: '',
  })
  const [isSavingVariant, setIsSavingVariant] = useState(false)
  
  // Modal states
  const [showDeleteProductConfirm, setShowDeleteProductConfirm] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [showDeleteVariantConfirm, setShowDeleteVariantConfirm] = useState(false)
  const [variantToDelete, setVariantToDelete] = useState<ProductVariant | null>(null)
  const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string; variant: 'error' | 'success' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'error',
  })

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    setIsLoading(true)
    try {
      // Use dedicated endpoints for management - more reliable than sync endpoint
      const [productsResponse, categoriesResponse] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ])

      const prods = productsResponse.data.data || []
      const cats = categoriesResponse.data.data || []

      // Products already come with variants loaded from the API
      setCategories(cats)
      setProducts(prods)
    } catch (error: any) {
      console.error('Failed to fetch menu:', error)
      const errorMessage = error?.response?.data?.message || 'Failed to load menu items'
      setAlertModal({
        open: true,
        title: 'Loading Error',
        message: `${errorMessage}. Please refresh the page.`,
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleNewProduct = async () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      category_id: categories[0]?.id || null,
      is_taxable: true, // Default to taxable
      price: '',
      cost: '',
    })
    setShowForm(true)
  }

  const handleEditProduct = async (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category_id,
      is_taxable: product.is_taxable ?? true,
      price: product.variants[0]?.price || '',
      cost: product.variants[0]?.cost || '',
    })
    setProductVariants(product.variants || [])
    setActiveTab('basic')
    setShowForm(true)
    
    // Fetch modifier groups and product modifiers
    try {
      const [groupsResponse, productResponse] = await Promise.all([
        api.get('/modifier-groups'),
        api.get(`/products/${product.id}`),
      ])
      setModifierGroups(groupsResponse.data.data || [])
      const assignedGroups = (productResponse.data.data.modifier_groups || []).map((g: any) => g.id)
      setAssignedModifierGroupIds(assignedGroups)
    } catch (error) {
      console.error('Failed to fetch product details:', error)
    }
  }

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product)
    setShowDeleteProductConfirm(true)
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      await api.delete(`/products/${productToDelete.id}`)
      setShowDeleteProductConfirm(false)
      setProductToDelete(null)
      fetchMenu()
    } catch (error) {
      console.error('Failed to delete product:', error)
      setAlertModal({
        open: true,
        title: 'Delete Failed',
        message: 'Failed to delete product. Please try again.',
        variant: 'error',
      })
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.price) return

    setIsSaving(true)
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, {
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id,
          is_taxable: formData.is_taxable,
          variants: [{
            id: editingProduct.variants[0]?.id,
            name: 'Default',
            price: parseFloat(formData.price),
            cost: parseFloat(formData.cost) || 0,
          }],
        })
      } else {
        await api.post('/products', {
          name: formData.name,
          description: formData.description,
          category_id: formData.category_id,
          is_taxable: formData.is_taxable,
          variants: [{
            name: 'Default',
            price: parseFloat(formData.price),
            cost: parseFloat(formData.cost) || 0,
          }],
        })
      }

      setShowForm(false)
      fetchMenu()
    } catch (error) {
      console.error('Failed to save product:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Variant handlers
  const handleNewVariant = () => {
    setEditingVariant(null)
    setVariantFormData({ name: '', sku: '', price: '', cost: '' })
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
    setShowDeleteVariantConfirm(true)
  }

  const confirmDeleteVariant = async () => {
    if (!variantToDelete) return
    try {
      await api.delete(`/variants/${variantToDelete.id}`)
      setProductVariants(productVariants.filter((v) => v.id !== variantToDelete.id))
      setShowDeleteVariantConfirm(false)
      setVariantToDelete(null)
      fetchMenu()
    } catch (error) {
      console.error('Failed to delete variant:', error)
      setAlertModal({
        open: true,
        title: 'Delete Failed',
        message: 'Failed to delete variant. Please try again.',
        variant: 'error',
      })
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
        setProductVariants(productVariants.map((v) => (v.id === editingVariant.id ? response.data.data : v)))
      } else {
        const response = await api.post('/variants', {
          product_id: editingProduct!.id,
          name: variantFormData.name,
          sku: variantFormData.sku || null,
          price: parseFloat(variantFormData.price),
          cost: parseFloat(variantFormData.cost) || 0,
        })
        setProductVariants([...productVariants, response.data.data])
      }
      setShowVariantForm(false)
      fetchMenu()
    } catch (error) {
      console.error('Failed to save variant:', error)
    } finally {
      setIsSavingVariant(false)
    }
  }

  const handleToggleModifierGroup = async (groupId: number) => {
    if (!editingProduct) return
    
    // Use functional update to ensure we have the latest state
    setAssignedModifierGroupIds(prevIds => {
      const isAssigned = prevIds.includes(groupId)
      const newIds = isAssigned
        ? prevIds.filter((id) => id !== groupId)
        : [...prevIds, groupId]
      
      // Call API with the new state
      api.put(`/products/${editingProduct.id}/modifiers`, {
        modifier_group_ids: newIds,
      }).then(response => {
        // Update state from server response to stay in sync
        const updatedProduct = response.data.data
        const serverAssignedGroups = (updatedProduct.modifier_groups || []).map((g: any) => g.id)
        setAssignedModifierGroupIds(serverAssignedGroups)
        fetchMenu()
      }).catch(error => {
        console.error('Failed to update modifiers:', error)
        setAlertModal({
          open: true,
          title: 'Update Failed',
          message: error?.response?.data?.message || 'Failed to update modifiers. Please try again.',
          variant: 'error',
        })
        // Refresh from server to restore correct state
        api.get(`/products/${editingProduct.id}`).then(res => {
          const actualGroups = (res.data.data.modifier_groups || []).map((g: any) => g.id)
          setAssignedModifierGroupIds(actualGroups)
        })
      })

      return newIds
    })
  }

  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Menu Management</h1>
          <Button onClick={handleNewProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card
            className="p-3 cursor-pointer hover:bg-secondary/50 transition-colors border-2 hover:border-primary/50"
            onClick={() => navigate('/app/categories')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderTree className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Categories</p>
                <p className="text-xs text-muted-foreground">{categories.length} total</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-3 cursor-pointer hover:bg-secondary/50 transition-colors border-2 hover:border-primary/50"
            onClick={() => {
              if (products.length > 0) {
                handleEditProduct(products[0])
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Variants</p>
                <p className="text-xs text-muted-foreground">{totalVariants} total</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-3 cursor-pointer hover:bg-secondary/50 transition-colors border-2 hover:border-primary/50"
            onClick={() => navigate('/app/modifiers')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Sliders className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Modifiers</p>
                <p className="text-xs text-muted-foreground">Manage</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All ({products.length})
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name} ({products.filter((p) => p.category_id === category.id).length})
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/categories')}
            className="text-primary border-primary/50"
          >
            <Plus className="w-3 h-3 mr-1" />
            Manage
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No items found in database</p>
            <Button variant="link" onClick={handleNewProduct}>
              Add your first item
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No items match your search or category filter</p>
            <p className="text-xs mt-2">Total items: {products.length}</p>
            <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="p-4">
                <div className="aspect-square bg-secondary/50 rounded-lg mb-3 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                </div>
                <h3 className="font-medium truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-primary font-semibold">
                    {(!product.variants || product.variants.length === 0)
                      ? 'No variants'
                      : product.variants.length > 1
                      ? `${product.variants.length} variants`
                      : formatCurrency(product.variants[0]?.price || 0)}
                  </p>
                  {product.variants && product.variants.length > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      {product.variants.length}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditProduct(product)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDeleteProduct(product)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Edit Item' : 'New Item'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs - Only show when editing */}
            {editingProduct && (
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={cn(
                    'flex-1 px-4 py-3 font-medium transition-colors border-b-2',
                    activeTab === 'basic'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Basic Info
                </button>
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
                    Variants ({productVariants.length})
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
            )}

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'basic' || !editingProduct ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Product name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <select
                      value={formData.category_id || ''}
                      onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                      className="w-full h-12 px-4 rounded-lg border border-input bg-background"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Tax Setting</label>
                    <div className="flex gap-4 mt-2">
                      <label
                        className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          !formData.is_taxable
                            ? 'border-primary bg-primary/5'
                            : 'border-input hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="is_taxable"
                          checked={!formData.is_taxable}
                          onChange={() => setFormData({ ...formData, is_taxable: false })}
                          className="sr-only"
                        />
                        <span className="font-medium">No Tax</span>
                      </label>
                      <label
                        className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          formData.is_taxable
                            ? 'border-primary bg-primary/5'
                            : 'border-input hover:border-primary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="is_taxable"
                          checked={formData.is_taxable}
                          onChange={() => setFormData({ ...formData, is_taxable: true })}
                          className="sr-only"
                        />
                        <span className="font-medium">Tax Included</span>
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Tax Included items will be taxed based on the Tax Type selected at checkout.
                    </p>
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
              ) : activeTab === 'variants' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Product Variants</h3>
                    <Button onClick={handleNewVariant} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Variant
                    </Button>
                  </div>

                  {productVariants.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <p>No variants</p>
                      <Button variant="link" onClick={handleNewVariant}>
                        Add your first variant
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {productVariants.map((variant) => (
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

                  {modifierGroups.length === 0 ? (
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

            <div className="p-4 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
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

      {/* Variant Form Modal */}
      {showVariantForm && editingProduct && (
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
                  {editingProduct.name}
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

      {/* Delete Product Confirmation Modal */}
      <ConfirmModal
        open={showDeleteProductConfirm}
        onOpenChange={(open) => {
          setShowDeleteProductConfirm(open)
          if (!open) setProductToDelete(null)
        }}
        title="Delete Product"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteProduct}
      />

      {/* Delete Variant Confirmation Modal */}
      <ConfirmModal
        open={showDeleteVariantConfirm}
        onOpenChange={(open) => {
          setShowDeleteVariantConfirm(open)
          if (!open) setVariantToDelete(null)
        }}
        title="Delete Variant"
        description={`Are you sure you want to delete variant "${variantToDelete?.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteVariant}
      />

      {/* Alert Modal */}
      <AlertModal
        open={alertModal.open}
        onOpenChange={(open) => setAlertModal({ ...alertModal, open })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </div>
  )
}
