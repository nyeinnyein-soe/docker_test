import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useConfigStore, TAX_TYPE_OPTIONS } from '@/stores/config'
import AlertModal from '@/components/common/AlertModal'
import type { TaxType } from '@/types'

export default function StoreSettings() {
  const navigate = useNavigate()
  const { storeSettings, fetchStoreSettings, updateStoreSettings, isLoading } = useConfigStore()
  
  const [commercialTaxRate, setCommercialTaxRate] = useState('')
  const [commercialTaxInclusive, setCommercialTaxInclusive] = useState(false)
  const [serviceChargeRate, setServiceChargeRate] = useState('')
  const [serviceChargeInclusive, setServiceChargeInclusive] = useState(false)
  const [defaultTaxType, setDefaultTaxType] = useState<TaxType>('NONE')
  const [isSaving, setIsSaving] = useState(false)
  const [alertModal, setAlertModal] = useState<{ open: boolean; title: string; message: string; variant: 'error' | 'success' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'success',
  })

  useEffect(() => {
    fetchStoreSettings()
  }, [])

  useEffect(() => {
    if (storeSettings) {
      // Convert rate from decimal (0.05) to percentage (5)
      setCommercialTaxRate((storeSettings.commercial_tax_rate * 100).toString())
      setCommercialTaxInclusive(storeSettings.commercial_tax_inclusive)
      setServiceChargeRate((storeSettings.service_charge_rate * 100).toString())
      setServiceChargeInclusive(storeSettings.service_charge_inclusive)
      setDefaultTaxType(storeSettings.default_tax_type)
    }
  }, [storeSettings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateStoreSettings({
        // Convert percentage (5) to decimal (0.05)
        commercial_tax_rate: parseFloat(commercialTaxRate) / 100 || 0,
        commercial_tax_inclusive: commercialTaxInclusive,
        service_charge_rate: parseFloat(serviceChargeRate) / 100 || 0,
        service_charge_inclusive: serviceChargeInclusive,
        default_tax_type: defaultTaxType,
      })
      setAlertModal({
        open: true,
        title: 'Success',
        message: 'Store settings saved successfully.',
        variant: 'success',
      })
    } catch (error) {
      setAlertModal({
        open: true,
        title: 'Error',
        message: 'Failed to save settings. Please try again.',
        variant: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/settings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Tax Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">Configure tax rates and service charges for your store</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading && !storeSettings ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Commercial Tax */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Commercial Tax</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tax Rate (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={commercialTaxRate}
                    onChange={(e) => setCommercialTaxRate(e.target.value)}
                    placeholder="e.g., 5 for 5%"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the percentage value (e.g., 5 for 5%)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="commercial-inclusive"
                    checked={commercialTaxInclusive}
                    onCheckedChange={(checked) => setCommercialTaxInclusive(checked as boolean)}
                  />
                  <label htmlFor="commercial-inclusive" className="text-sm font-medium leading-none cursor-pointer">
                    Tax is included in product prices
                  </label>
                </div>
              </div>
            </Card>

            {/* Service Charge */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Service Charge</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Service Charge Rate (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={serviceChargeRate}
                    onChange={(e) => setServiceChargeRate(e.target.value)}
                    placeholder="e.g., 10 for 10%"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the percentage value (e.g., 10 for 10%)
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="service-inclusive"
                    checked={serviceChargeInclusive}
                    onCheckedChange={(checked) => setServiceChargeInclusive(checked as boolean)}
                  />
                  <label htmlFor="service-inclusive" className="text-sm font-medium leading-none cursor-pointer">
                    Service charge is included in product prices
                  </label>
                </div>
              </div>
            </Card>

            {/* Default Tax Type */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Default Tax Type</h2>
              <p className="text-sm text-muted-foreground mb-4">
                This is the default tax type applied at checkout. Cashiers can override this per order.
              </p>
              <div className="space-y-2">
                {TAX_TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      defaultTaxType === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:bg-secondary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="defaultTaxType"
                      value={option.value}
                      checked={defaultTaxType === option.value}
                      onChange={(e) => setDefaultTaxType(e.target.value as TaxType)}
                      className="mr-3"
                    />
                    <span className="font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-white">
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

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
