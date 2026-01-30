import { useConfigStore } from '@/stores/config'
import RetailSell from './RetailSell'
import CafeSell from './CafeSell'
import RestaurantSell from './RestaurantSell'

export default function SellPage() {
  const { posMode } = useConfigStore()

  switch (posMode) {
    case 'CAFE':
      return <CafeSell />
    case 'RESTAURANT':
      return <RestaurantSell />
    case 'RETAIL':
    default:
      return <RetailSell />
  }
}
