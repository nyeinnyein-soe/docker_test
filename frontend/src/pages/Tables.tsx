import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, X, Save, Loader2, MapPin, Users } from 'lucide-react'
import ConfirmModal from '@/components/common/ConfirmModal'
import FloorCanvas from '@/components/tables/FloorCanvas'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Table, Floor as FloorSection } from '@/types'

// Local interfaces removed as we use global Table from @/types

interface SectionFormData {
  name: string
}

interface TableFormData {
  section_id: number
  name: string
  capacity: number
  x_pos: number
  y_pos: number
}

export default function Tables() {
  const [sections, setSections] = useState<FloorSection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSectionForm, setShowSectionForm] = useState(false)
  const [showTableForm, setShowTableForm] = useState(false)
  const [editingSection, setEditingSection] = useState<FloorSection | null>(null)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [selectedSection, setSelectedSection] = useState<number | null>(null)
  const [sectionFormData, setSectionFormData] = useState<SectionFormData>({ name: '' })
  const [tableFormData, setTableFormData] = useState<TableFormData>({
    section_id: 0,
    name: '',
    capacity: 4,
    x_pos: 0,
    y_pos: 0,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteSectionConfirm, setShowDeleteSectionConfirm] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<FloorSection | null>(null)
  const [showDeleteTableConfirm, setShowDeleteTableConfirm] = useState(false)
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null)

  useEffect(() => {
    fetchSections()
  }, [])

  const fetchSections = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/floor-sections')
      setSections(response.data.data || [])
      if (response.data.data && response.data.data.length > 0 && !selectedSection) {
        setSelectedSection(response.data.data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewSection = () => {
    setEditingSection(null)
    setSectionFormData({ name: '' })
    setShowSectionForm(true)
  }

  const handleEditSection = (section: FloorSection) => {
    setEditingSection(section)
    setSectionFormData({ name: section.name })
    setShowSectionForm(true)
  }

  const handleDeleteSection = (section: FloorSection) => {
    setSectionToDelete(section)
    setShowDeleteSectionConfirm(true)
  }

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return

    try {
      await api.delete(`/floor-sections/${sectionToDelete.id}`)
      setShowDeleteSectionConfirm(false)
      if (selectedSection === sectionToDelete.id) {
        setSelectedSection(null)
      }
      setSectionToDelete(null)
      fetchSections()
    } catch (error) {
      console.error('Failed to delete section:', error)
    }
  }

  const handleSaveSection = async () => {
    if (!sectionFormData.name) return

    setIsSaving(true)
    try {
      if (editingSection) {
        await api.put(`/floor-sections/${editingSection.id}`, sectionFormData)
      } else {
        await api.post('/floor-sections', sectionFormData)
      }

      setShowSectionForm(false)
      fetchSections()
    } catch (error) {
      console.error('Failed to save section:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNewTable = (sectionId: number) => {
    setEditingTable(null)
    setTableFormData({
      section_id: sectionId,
      name: '',
      capacity: 4,
      x_pos: 50,
      y_pos: 50,
    })
    setShowTableForm(true)
  }

  const handleEditTable = (table: Table) => {
    setEditingTable(table)
    setTableFormData({
      section_id: table.section_id,
      name: table.name,
      capacity: table.capacity,
      x_pos: table.x_pos,
      y_pos: table.y_pos,
    })
    setShowTableForm(true)
  }

  /* Deletion handled via table edit modal or future implementation */
  // const handleDeleteTable = async (table: Table) => {
  //   setDeletingTable(table)
  //   setShowDeleteConfirm(true)
  // }

  const confirmDeleteTable = async () => {
    if (!tableToDelete) return

    try {
      await api.delete(`/tables/${tableToDelete.id}`)
      setShowDeleteTableConfirm(false)
      setTableToDelete(null)
      fetchSections()
    } catch (error) {
      console.error('Failed to delete table:', error)
    }
  }

  const handleTablePositionUpdate = async (tableId: number, x: number, y: number) => {
    try {
      // Optimistic update
      setSections(prev => prev.map(section => ({
        ...section,
        tables: section.tables.map((t: Table) => t.id === tableId ? { ...t, x_pos: x, y_pos: y } : t)
      })))

      await api.put(`/tables/${tableId}`, { x_pos: x, y_pos: y })
    } catch (error) {
      console.error('Failed to update table position:', error)
      fetchSections() // Rollback
    }
  }

  const handleSaveTable = async () => {
    if (!tableFormData.name) return

    setIsSaving(true)
    try {
      if (editingTable) {
        await api.put(`/tables/${editingTable.id}`, tableFormData)
      } else {
        await api.post('/tables', tableFormData)
      }

      setShowTableForm(false)
      fetchSections()
    } catch (error) {
      console.error('Failed to save table:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const currentSection = sections.find((s) => s.id === selectedSection) as any

  return (
    <div className="h-full flex flex-col lg:flex-row bg-slate-50/50 overflow-hidden">
      {/* Sections Sidebar / Tabs */}
      <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r bg-white flex flex-col shrink-0 z-30 shadow-sm lg:shadow-none">
        <div className="p-4 border-b bg-slate-50/50 lg:bg-white flex items-center justify-between">
          <h2 className="font-black text-slate-800 uppercase tracking-widest text-xs">Floors</h2>
          <Button size="sm" onClick={handleNewSection} variant="outline" className="h-8 w-8 p-0 rounded-xl shadow-sm border-slate-200">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Horizontal scroll for mobile/tablet, vertical for desktop */}
        <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto p-2 lg:p-3 scrollbar-none gap-2 lg:gap-3 bg-white min-h-[80px] lg:min-h-0">
          {sections.map((section) => (
            <div
              key={section.id}
              className={cn(
                "relative group flex-shrink-0 lg:flex-shrink p-3 lg:p-4 rounded-2xl transition-all duration-300 cursor-pointer min-w-[160px] lg:min-w-0 border",
                selectedSection === section.id
                  ? 'bg-primary text-white shadow-xl shadow-primary/20 border-primary scale-[1.02]'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-200 shadow-sm'
              )}
              onClick={() => setSelectedSection(section.id)}
            >
              <div className="flex flex-row lg:flex-col justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-black truncate text-xs lg:text-sm uppercase tracking-wider">{section.name}</div>
                  <div className={cn(
                    "text-[10px] font-bold opacity-70",
                    selectedSection === section.id ? "text-white/80" : "text-slate-400"
                  )}>
                    {section.tables?.length || 0} tables
                  </div>
                </div>

                <div className={cn(
                  "flex gap-1.5 transition-all duration-300",
                  selectedSection === section.id ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:translate-x-0 lg:group-hover:pointer-events-auto"
                )}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 rounded-xl transition-colors",
                      selectedSection === section.id ? "text-white hover:bg-white/20" : "text-slate-400 hover:bg-slate-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditSection(section)
                    }}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 rounded-xl transition-colors",
                      selectedSection === section.id ? "text-white hover:bg-white/20" : "text-red-500 hover:bg-red-50"
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSection(section)
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {sections.length === 0 && !isLoading && (
            <div className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Click + to add<br />your first floor
            </div>
          )}
        </div>
      </div>

      {/* Tables Grid area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="px-4 py-3 border-b bg-white/80 backdrop-blur-md z-20 shadow-sm flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-primary rounded-full" />
            <h1 className="text-sm lg:text-base font-black text-slate-800 tracking-tight uppercase">
              {currentSection ? `Floor: ${currentSection.name}` : 'Select a Floor'}
            </h1>
          </div>

          {currentSection && (
            <Button
              onClick={() => handleNewTable(currentSection.id)}
              className="rounded-2xl shadow-lg shadow-primary/20 h-10 px-6 font-black uppercase text-[10px] tracking-widest gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Table</span>
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-hidden p-2 md:p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !currentSection ? (
            <div className="text-center text-muted-foreground py-12">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a floor section to manage tables</p>
            </div>
          ) : currentSection.tables?.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>No tables in this section</p>
              <Button variant="link" onClick={() => handleNewTable(currentSection.id)}>
                Add your first table
              </Button>
            </div>
          ) : (
            <FloorCanvas
              tables={currentSection.tables}
              onTableUpdate={handleTablePositionUpdate}
              onTableEdit={handleEditTable}
            />
          )}
        </div>
      </div>

      {/* Section Form Modal */}
      {showSectionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">
                {editingSection ? 'Edit Floor' : 'New Floor'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSectionForm(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Floor Name</label>
                <Input
                  value={sectionFormData.name}
                  onChange={(e) => setSectionFormData({ name: e.target.value })}
                  placeholder="e.g., Ground Floor, First Floor"
                />
              </div>
            </div>

            <div className="p-4 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowSectionForm(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveSection}
                disabled={isSaving || !sectionFormData.name}
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

      {/* Table Form Modal */}
      {showTableForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">
                {editingTable ? 'Edit Table' : 'New Table'}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowTableForm(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Table Name</label>
                <Input
                  value={tableFormData.name}
                  onChange={(e) => setTableFormData({ ...tableFormData, name: e.target.value })}
                  placeholder="e.g., Table 1, T-01"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Capacity (Guests)</label>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <Input
                    type="number"
                    min={1}
                    value={tableFormData.capacity}
                    onChange={(e) => setTableFormData({ ...tableFormData, capacity: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">X Position</label>
                  <Input
                    type="number"
                    value={tableFormData.x_pos}
                    onChange={(e) =>
                      setTableFormData({ ...tableFormData, x_pos: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Y Position</label>
                  <Input
                    type="number"
                    value={tableFormData.y_pos}
                    onChange={(e) =>
                      setTableFormData({ ...tableFormData, y_pos: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowTableForm(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveTable}
                disabled={isSaving || !tableFormData.name}
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

      {/* Delete Section Confirmation */}
      <ConfirmModal
        open={showDeleteSectionConfirm}
        onOpenChange={(open) => {
          setShowDeleteSectionConfirm(open)
          if (!open) setSectionToDelete(null)
        }}
        title="Delete Floor Section"
        description={`Are you sure you want to delete "${sectionToDelete?.name}"? All tables in this section will be deleted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteSection}
      />

      {/* Delete Table Confirmation */}
      <ConfirmModal
        open={showDeleteTableConfirm}
        onOpenChange={(open) => {
          setShowDeleteTableConfirm(open)
          if (!open) setTableToDelete(null)
        }}
        title="Delete Table"
        description={`Are you sure you want to delete table "${tableToDelete?.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteTable}
      />
    </div>
  )
}
