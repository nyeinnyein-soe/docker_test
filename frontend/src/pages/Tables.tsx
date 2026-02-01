import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, X, Save, Loader2, MapPin } from 'lucide-react'
import ConfirmModal from '@/components/common/ConfirmModal'
import api from '@/lib/api'

interface FloorSection {
  id: number
  name: string
  tables: Table[]
}

interface Table {
  id: number
  name: string
  x_pos: number
  y_pos: number
  section_id: number
}

interface SectionFormData {
  name: string
}

interface TableFormData {
  section_id: number
  name: string
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
      x_pos: 0,
      y_pos: 0,
    })
    setShowTableForm(true)
  }

  const handleEditTable = (table: Table) => {
    setEditingTable(table)
    setTableFormData({
      section_id: table.section_id,
      name: table.name,
      x_pos: table.x_pos,
      y_pos: table.y_pos,
    })
    setShowTableForm(true)
  }

  const handleDeleteTable = (table: Table) => {
    setTableToDelete(table)
    setShowDeleteTableConfirm(true)
  }

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

  const currentSection = sections.find((s) => s.id === selectedSection)

  return (
    <div className="h-full flex">
      {/* Sections Sidebar */}
      <div className="w-64 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">Floors</h2>
            <Button size="sm" onClick={handleNewSection}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`w-full p-3 rounded-lg mb-2 transition-colors ${
                selectedSection === section.id
                  ? 'bg-primary text-white'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              <button
                onClick={() => setSelectedSection(section.id)}
                className="w-full text-left"
              >
                <div className="font-medium">{section.name}</div>
                <div className="text-xs opacity-70">
                  {section.tables?.length || 0} tables
                </div>
              </button>
              <div className="flex gap-1 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditSection(section)
                  }}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-7 text-xs text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteSection(section)
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {currentSection ? `Tables - ${currentSection.name}` : 'Select a Floor'}
            </h1>
            {currentSection && (
              <Button onClick={() => handleNewTable(currentSection.id)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
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
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {currentSection.tables.map((table) => (
                <Card key={table.id} className="p-4 text-center">
                  <div className="aspect-square bg-secondary/50 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-2xl font-bold">{table.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditTable(table)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDeleteTable(table)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
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
