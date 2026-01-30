import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { Product, Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface ProductGridProps {
  categories: Category[]
  products: Product[]
  selectedCategory: number | null
  onCategorySelect: (categoryId: number | null) => void
  onProductClick: (product: Product) => void
}

export default function ProductGrid({
  categories,
  products,
  selectedCategory,
  onCategorySelect,
  onProductClick,
}: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            className="flex-shrink-0"
            onClick={() => onCategorySelect(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0"
              onClick={() => onCategorySelect(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="p-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] touch-target"
              onClick={() => onProductClick(product)}
            >
              <div className="aspect-square bg-secondary/50 rounded-lg mb-2 flex items-center justify-center">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-3xl">
                    {product.category_id === 1 ? '☕' : '🍽️'}
                  </span>
                )}
              </div>
              <h3 className="font-medium text-sm truncate">{product.name}</h3>
              <p className="text-primary font-semibold text-sm">
                {formatCurrency(product.variants[0]?.price || 0)}
              </p>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p>No products found</p>
          </div>
        )}
      </div>
    </div>
  )
}
