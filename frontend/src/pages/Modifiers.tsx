import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { Plus, Edit, Trash2, X, Save, Loader2, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react'
import ConfirmModal from '@/components/common/ConfirmModal'
import api from '@/lib/api'

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

export default function Modifiers() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<ModifierGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [showModifierForm, setShowModifierForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null)
  const [editingModifier, setEditingModifier] = useState<Modifier | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    min_select: 0,
    max_select: 1,
  })
  const [modifierFormData, setModifierFormData] = useState({
    name: '',
    price_extra: '',
    cost_extra: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<ModifierGroup | null>(null)
  const [showDeleteModifierConfirm, setShowDeleteModifierConfirm] = useState(false)
  const [modifierToDelete, setModifierToDelete] = useState<Modifier | null>(null)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/modifier-groups')
      setGroups(response.data.data || [])
      // Expand first group by default
      if (response.data.data && response.data.data.length > 0) {
        setExpandedGroups(new Set([response.data.data[0].id]))
        setSelectedGroup(response.data.data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch modifier groups:', error)
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
    setGroupFormData({
      name: '',
      min_select: 0,
      max_select: 1,
    })
    setShowGroupForm(true)
  }

  const handleEditGroup = (group: ModifierGroup) => {
    setEditingGroup(group)
    setGroupFormData({
      name: group.name,
      min_select: group.min_select,
      max_select: group.max_select,
    })
    setShowGroupForm(true)
  }

  const handleDeleteGroup = (group: ModifierGroup) => {
    setGroupToDelete(group)
    setShowDeleteGroupConfirm(true)
  }

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return

    try {
      await api.delete(`/modifier-groups/${groupToDelete.id}`)
      setShowDeleteGroupConfirm(false)
      setGroupToDelete(null)
      fetchGroups()
    } catch (error) {
      console.error('Failed to delete group:', error)
    }
  }

  const handleSaveGroup = async () => {
    if (!groupFormData.name) return

    setIsSaving(true)
    try {
      if (editingGroup) {
        await api.put(`/modifier-groups/${editingGroup.id}`, groupFormData)
      } else {
        await api.post('/modifier-groups', groupFormData)
      }

      setShowGroupForm(false)
      fetchGroups()
    } catch (error) {
      console.error('Failed to save group:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNewModifier = (groupId: number) => {
    setEditingModifier(null)
    setSelectedGroup(groupId)
    setModifierFormData({
      name: '',
      price_extra: '',
      cost_extra: '',
    })
    setShowModifierForm(true)
  }

  const handleEditModifier = (modifier: Modifier) => {
    setEditingModifier(modifier)
    setSelectedGroup(modifier.group_id)
    setModifierFormData({
      name: modifier.name,
      price_extra: modifier.price_extra,
      cost_extra: modifier.cost_extra,
    })
    setShowModifierForm(true)
  }

  const handleDeleteModifier = (modifier: Modifier) => {
    setModifierToDelete(modifier)
    setShowDeleteModifierConfirm(true)
  }

  const confirmDeleteModifier = async () => {
    if (!modifierToDelete) return

    try {
      await api.delete(`/modifiers/${modifierToDelete.id}`)
      setShowDeleteModifierConfirm(false)
      setModifierToDelete(null)
      fetchGroups()
    } catch (error) {
      console.error('Failed to delete modifier:', error)
    }
  }

  const handleSaveModifier = async () => {
    if (!modifierFormData.name || !selectedGroup) return

    setIsSaving(true)
    try {
      if (editingModifier) {
        await api.put(`/modifiers/${editingModifier.id}`, {
          name: modifierFormData.name,
          price_extra: parseFloat(modifierFormData.price_extra) || 0,
          cost_extra: parseFloat(modifierFormData.cost_extra) || 0,
        })
      } else {
        await api.post('/modifiers', {
          group_id: selectedGroup,
          name: modifierFormData.name,
          price_extra: parseFloat(modifierFormData.price_extra) || 0,
          cost_extra: parseFloat(modifierFormData.cost_extra) || 0,
        })
      }

      setShowModifierForm(false)
      fetchGroups()
    } catch (error) {
      console.error('Failed to save modifier:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/items')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Modifiers</h1>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Manage add-ons and extras for your products</p>
          <Button onClick={handleNewGroup}>
            <Plus className="w-4 h-4 mr-2" />
            Add Group
          </Button>
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No modifier groups found</p>
            <Button variant="link" onClick={handleNewGroup}>
              Add your first modifier group
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
                        Select {group.min_select}-{group.max_select > 0 ? group.max_select : 'unlimited'} •{' '}
                        {group.modifiers?.length || 0} modifiers
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNewModifier(group.id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditGroup(group)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeleteGroup(group)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Modifiers List */}
                {expandedGroups.has(group.id) && (
                  <div className="mt-3 space-y-2 pl-6">
                    {group.modifiers?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No modifiers</p>
                    ) : (
                      group.modifiers.map((modifier) => (
                        <div
                          key={modifier.id}
                          className="flex items-center justify-between p-2 bg-secondary/30 rounded"
                        >
                          <div className="flex-1">
                            <span className="font-medium">{modifier.name}</span>
                            {parseFloat(modifier.price_extra) > 0 && (
                              <span className="text-sm text-muted-foreground ml-2">
                                +{formatCurrency(modifier.price_extra)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditModifier(modifier)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDeleteModifier(modifier)}
                            >
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

      {/* Group Form Modal */}
      {showGroupForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">
                {editingGroup ? 'Edit Group' : 'New Modifier Group'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowGroupForm(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  placeholder="e.g., Size, Toppings, Extras"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Min Select</label>
                  <Input
                    type="number"
                    value={groupFormData.min_select}
                    onChange={(e) =>
                      setGroupFormData({ ...groupFormData, min_select: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Select</label>
                  <Input
                    type="number"
                    value={groupFormData.max_select}
                    onChange={(e) =>
                      setGroupFormData({ ...groupFormData, max_select: parseInt(e.target.value) || 1 })
                    }
                    min="1"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowGroupForm(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveGroup}
                disabled={isSaving || !groupFormData.name}
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

      {/* Modifier Form Modal */}
      {showModifierForm && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">
                {editingModifier ? 'Edit Modifier' : 'New Modifier'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowModifierForm(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Modifier Name</label>
                <Input
                  value={modifierFormData.name}
                  onChange={(e) => setModifierFormData({ ...modifierFormData, name: e.target.value })}
                  placeholder="e.g., Extra Cheese, Large Size"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Price Extra</label>
                  <Input
                    type="number"
                    value={modifierFormData.price_extra}
                    onChange={(e) =>
                      setModifierFormData({ ...modifierFormData, price_extra: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cost Extra</label>
                  <Input
                    type="number"
                    value={modifierFormData.cost_extra}
                    onChange={(e) =>
                      setModifierFormData({ ...modifierFormData, cost_extra: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModifierForm(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveModifier}
                disabled={isSaving || !modifierFormData.name}
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

      {/* Delete Group Confirmation */}
      <ConfirmModal
        open={showDeleteGroupConfirm}
        onOpenChange={(open) => {
          setShowDeleteGroupConfirm(open)
          if (!open) setGroupToDelete(null)
        }}
        title="Delete Modifier Group"
        description={`Are you sure you want to delete "${groupToDelete?.name}"? All modifiers in this group will be deleted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteGroup}
      />

      {/* Delete Modifier Confirmation */}
      <ConfirmModal
        open={showDeleteModifierConfirm}
        onOpenChange={(open) => {
          setShowDeleteModifierConfirm(open)
          if (!open) setModifierToDelete(null)
        }}
        title="Delete Modifier"
        description={`Are you sure you want to delete modifier "${modifierToDelete?.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteModifier}
      />
    </div>
  )
}
