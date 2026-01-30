import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Edit, Trash2, X, Save, Loader2, ChevronDown, ChevronRight, ArrowLeft, Percent } from 'lucide-react'
import api from '@/lib/api'
import type { TaxGroup, Tax } from '@/types'

export default function Taxes() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<TaxGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [showTaxForm, setShowTaxForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<TaxGroup | null>(null)
  const [editingTax, setEditingTax] = useState<Tax | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())
  const [groupFormData, setGroupFormData] = useState({
    name: '',
  })
  const [taxFormData, setTaxFormData] = useState({
    name: '',
    rate: '',
    is_inclusive: false,
    priority: 0,
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/tax-groups')
      setGroups(response.data.data || [])
      if (response.data.data && response.data.data.length > 0) {
        setExpandedGroups(new Set([response.data.data[0].id]))
        setSelectedGroup(response.data.data[0].id)
      }
    } catch (error: any) {
      console.error('Failed to fetch tax groups:', error)
      const errorMessage = error?.response?.data?.message || 'Failed to load tax groups'
      alert(errorMessage)
      // Don't prevent page from rendering - show empty state
      setGroups([])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleGroup = (groupId: number) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  const handleNewGroup = () => {
    setEditingGroup(null)
    setGroupFormData({ name: '' })
    setShowGroupForm(true)
  }

  const handleEditGroup = (group: TaxGroup) => {
    setEditingGroup(group)
    setGroupFormData({ name: group.name })
    setShowGroupForm(true)
  }

  const handleDeleteGroup = async (group: TaxGroup) => {
    if (!confirm(`Delete tax group "${group.name}"?`)) return

    try {
      await api.delete(`/tax-groups/${group.id}`)
      fetchGroups()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete tax group')
    }
  }

  const handleSaveGroup = async () => {
    if (!groupFormData.name) return

    setIsSaving(true)
    try {
      if (editingGroup) {
        await api.put(`/tax-groups/${editingGroup.id}`, groupFormData)
      } else {
        await api.post('/tax-groups', groupFormData)
      }
      setShowGroupForm(false)
      fetchGroups()
    } catch (error) {
      console.error('Failed to save group:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNewTax = (groupId: number) => {
    setEditingTax(null)
    setSelectedGroup(groupId)
    setTaxFormData({
      name: '',
      rate: '',
      is_inclusive: false,
      priority: 0,
    })
    setShowTaxForm(true)
  }

  const handleEditTax = (tax: Tax) => {
    setEditingTax(tax)
    setSelectedGroup(tax.tax_group_id)
    setTaxFormData({
      name: tax.name,
      rate: (parseFloat(tax.rate) * 100).toString(),
      is_inclusive: tax.is_inclusive,
      priority: tax.priority,
    })
    setShowTaxForm(true)
  }

  const handleDeleteTax = async (tax: Tax) => {
    if (!confirm(`Delete tax "${tax.name}"?`)) return

    try {
      const group = groups.find(g => g.id === tax.tax_group_id)
      if (group) {
        const updatedTaxes = group.taxes.filter(t => t.id !== tax.id)
        await api.put(`/tax-groups/${group.id}`, {
          name: group.name,
          taxes: updatedTaxes
        })
        fetchGroups()
      }
    } catch (error) {
      console.error('Failed to delete tax:', error)
    }
  }

  const handleSaveTax = async () => {
    if (!taxFormData.name || !selectedGroup) return

    setIsSaving(true)
    try {
      const group = groups.find(g => g.id === selectedGroup)
      if (group) {
        const newTax = {
          id: editingTax?.id,
          name: taxFormData.name,
          rate: parseFloat(taxFormData.rate) / 100,
          is_inclusive: taxFormData.is_inclusive,
          priority: taxFormData.priority,
        }

        let updatedTaxes = [...(group.taxes || [])]
        if (editingTax) {
          updatedTaxes = updatedTaxes.map(t => t.id === editingTax.id ? { ...t, ...newTax } : t)
        } else {
          updatedTaxes.push(newTax as any)
        }

        await api.put(`/tax-groups/${selectedGroup}`, {
          name: group.name,
          taxes: updatedTaxes
        })
      }

      setShowTaxForm(false)
      fetchGroups()
    } catch (error) {
      console.error('Failed to save tax:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-white">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/settings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Tax Settings</h1>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Manage tax rates and groups for your products</p>
          <Button onClick={handleNewGroup}>
            <Plus className="w-4 h-4 mr-2" />
            Add Group
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Percent className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No tax groups found</p>
            <Button variant="link" onClick={handleNewGroup}>
              Add your first tax group
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <Card key={group.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="p-1 hover:bg-secondary rounded"
                    >
                      {expandedGroups.has(group.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h3 className="font-semibold">{group.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {group.taxes?.length || 0} tax rates
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleNewTax(group.id)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Tax Rate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditGroup(group)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteGroup(group)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {expandedGroups.has(group.id) && (
                  <div className="mt-3 space-y-2 pl-6">
                    {group.taxes?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No tax rates defined</p>
                    ) : (
                      group.taxes.map((tax) => (
                        <div key={tax.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                          <div className="flex-1">
                            <span className="font-medium">{tax.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {(parseFloat(tax.rate) * 100).toFixed(2)}% 
                              {tax.is_inclusive ? ' (Inclusive)' : ' (Exclusive)'}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditTax(tax)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteTax(tax)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {showGroupForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">{editingGroup ? 'Edit Group' : 'New Tax Group'}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowGroupForm(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ name: e.target.value })}
                  placeholder="e.g., Standard VAT, No Tax"
                />
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowGroupForm(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSaveGroup} disabled={isSaving || !groupFormData.name}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showTaxForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">{editingTax ? 'Edit Tax Rate' : 'New Tax Rate'}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowTaxForm(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Tax Name</label>
                <Input
                  value={taxFormData.name}
                  onChange={(e) => setTaxFormData({ ...taxFormData, name: e.target.value })}
                  placeholder="e.g., VAT 5%, Service Charge 10%"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rate (%)</label>
                <Input
                  type="number"
                  value={taxFormData.rate}
                  onChange={(e) => setTaxFormData({ ...taxFormData, rate: e.target.value })}
                  placeholder="5"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inclusive"
                  checked={taxFormData.is_inclusive}
                  onCheckedChange={(checked) => setTaxFormData({ ...taxFormData, is_inclusive: checked as boolean })}
                />
                <label htmlFor="inclusive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Tax is included in product price
                </label>
              </div>
              <div>
                <label className="text-sm font-medium">Priority (Order of calculation)</label>
                <Input
                  type="number"
                  value={taxFormData.priority}
                  onChange={(e) => setTaxFormData({ ...taxFormData, priority: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowTaxForm(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSaveTax} disabled={isSaving || !taxFormData.name || !taxFormData.rate}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
