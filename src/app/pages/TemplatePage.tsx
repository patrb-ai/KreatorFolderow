import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import JSZip from 'jszip'
import { Folder, Folders, FolderPlus, Trash2 } from 'lucide-react'
import type { FolderNode, Template } from '../../types'

export default function TemplatePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'creator' | 'templates'>('creator')
  const [templates, setTemplates] = useState<Template[]>([])
  const [idCounter, setIdCounter] = useState(0)
  const [currentTemplate, setCurrentTemplate] = useState<Template>({
    id: `template_${Date.now()}`,
    name: 'Nazwa Szablonu',
    folders: [],
  })
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState('Nazwa Szablonu')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  useEffect(() => {
    if (!localStorage.getItem('isAuthenticated')) navigate('/login')
    const saved = localStorage.getItem('templates')
    if (saved) setTemplates(JSON.parse(saved))
  }, [navigate])

  const generateId = () => {
    const id = `folder_${Date.now()}_${idCounter}`
    setIdCounter(p => p + 1)
    return id
  }

  const findAndUpdate = (
    folders: FolderNode[],
    id: string,
    fn: (f: FolderNode) => FolderNode
  ): FolderNode[] =>
    folders.map(f =>
      f.id === id ? fn(f) : { ...f, children: findAndUpdate(f.children, id, fn) }
    )

  const findAndDelete = (folders: FolderNode[], id: string): FolderNode[] =>
    folders
      .filter(f => f.id !== id)
      .map(f => ({ ...f, children: findAndDelete(f.children, id) }))

  const addFolder = () => {
    const newFolder: FolderNode = {
      id: generateId(),
      name: 'Nowy Folder',
      children: [],
      isEditing: false,
      isExpanded: true,
    }
    if (selectedFolderId) {
      setCurrentTemplate(t => ({
        ...t,
        folders: findAndUpdate(t.folders, selectedFolderId, f => ({
          ...f,
          children: [...f.children, newFolder],
          isExpanded: true,
        })),
      }))
    } else {
      setCurrentTemplate(t => ({ ...t, folders: [...t.folders, newFolder] }))
    }
  }

  const deleteFolder = (id: string) => {
    setCurrentTemplate(t => ({ ...t, folders: findAndDelete(t.folders, id) }))
    if (selectedFolderId === id) setSelectedFolderId(null)
  }

  const startEditing = (id: string) => {
    setCurrentTemplate(t => ({
      ...t,
      folders: findAndUpdate(t.folders, id, f => ({ ...f, isEditing: true })),
    }))
  }

  const updateFolderName = (id: string, name: string) => {
    setCurrentTemplate(t => ({
      ...t,
      folders: findAndUpdate(t.folders, id, f => ({ ...f, name, isEditing: false })),
    }))
  }

  const cancelEditing = (id: string) => {
    setCurrentTemplate(t => ({
      ...t,
      folders: findAndUpdate(t.folders, id, f => ({ ...f, isEditing: false })),
    }))
  }

  const saveTemplate = () => {
    if (currentTemplate.folders.length === 0) {
      alert('Dodaj przynajmniej jeden folder do szablonu')
      return
    }
    const updated = [...templates, currentTemplate]
    setTemplates(updated)
    localStorage.setItem('templates', JSON.stringify(updated))
    const newId = `template_${Date.now()}_${idCounter}`
    setCurrentTemplate({ id: newId, name: 'Nazwa Szablonu', folders: [] })
    setTempName('Nazwa Szablonu')
    setIdCounter(p => p + 1)
    alert('Szablon zapisany!')
  }

  const addFoldersToZip = (zip: JSZip, folders: FolderNode[], parent = '') => {
    folders.forEach(f => {
      const path = parent ? `${parent}/${f.name}` : f.name
      zip.folder(path)
      if (f.children.length > 0) addFoldersToZip(zip, f.children, path)
    })
  }

  const importFolders = async () => {
    if (currentTemplate.folders.length === 0) {
      alert('Brak folderów do zaimportowania.')
      return
    }
    try {
      const zip = new JSZip()
      const main = zip.folder(currentTemplate.name)!
      addFoldersToZip(main, currentTemplate.folders)
      main.file(
        'README.txt',
        `Struktura folderów: ${currentTemplate.name}\n` +
        `Utworzono: ${new Date().toLocaleString('pl-PL')}\n\n` +
        `Instrukcja:\n` +
        `1. Rozpakuj to archiwum ZIP w wybranym miejscu\n` +
        `2. Struktura folderów zostanie automatycznie utworzona\n` +
        `3. Możesz usunąć ten plik README.txt\n\n` +
        `Struktura:\n` +
        currentTemplate.folders
          .map(f => `- ${f.name}${f.children.length > 0 ? ` (${f.children.length} podfolderów)` : ''}`)
          .join('\n')
      )
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentTemplate.name}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Błąd podczas tworzenia archiwum: ${msg}`)
    }
  }

  const updateTemplateName = () => {
    if (tempName.trim()) {
      setCurrentTemplate(t => ({ ...t, name: tempName.trim() }))
      setEditingName(false)
    }
  }

  const createNewTemplate = () => {
    setActiveTab('creator')
    setCurrentTemplate({
      id: `template_${Date.now()}_${idCounter}`,
      name: 'Nazwa Szablonu',
      folders: [],
    })
    setTempName('Nazwa Szablonu')
    setSelectedFolderId(null)
    setEditingName(true)
    setIdCounter(p => p + 1)
  }

  const deleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id)
    setTemplates(updated)
    localStorage.setItem('templates', JSON.stringify(updated))
    if (selectedTemplateId === id) setSelectedTemplateId(null)
  }

  const loadTemplate = (template: Template) => {
    setCurrentTemplate(template)
    setTempName(template.name)
    setActiveTab('creator')
    setSelectedFolderId(null)
  }

  const renderFolder = (folder: FolderNode, level = 0): JSX.Element => {
    const isSelected = selectedFolderId === folder.id
    return (
      <div key={folder.id}>
        <div
          className={`relative flex items-center h-[40px] rounded-[8px] mb-2 ${
            isSelected ? 'bg-[#f8fafc]' : ''
          }`}
          onClick={e => {
            e.stopPropagation()
            setSelectedFolderId(folder.id)
          }}
        >
          {level > 0 && (
            <div
              className="absolute h-px bg-[#E2E8F0]"
              style={{
                left: `${12 + (level - 1) * 40}px`,
                top: '20px',
                width: '23px',
              }}
            />
          )}
          <div className="absolute" style={{ left: `${12 + level * 40}px` }}>
            <Folder size={24} color="#E8AC3E" strokeWidth={2} />
          </div>
          {folder.isEditing ? (
            <input
              type="text"
              defaultValue={folder.name}
              autoFocus
              className="absolute text-[16px] text-[#314158] bg-white border border-[#e2e8f0] rounded px-2 py-1 z-10 outline-none"
              style={{ left: `${48 + level * 40}px` }}
              onClick={e => e.stopPropagation()}
              onBlur={e => {
                const val = e.target.value.trim()
                val ? updateFolderName(folder.id, val) : cancelEditing(folder.id)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim()
                  val ? updateFolderName(folder.id, val) : cancelEditing(folder.id)
                }
                if (e.key === 'Escape') cancelEditing(folder.id)
              }}
            />
          ) : (
            <p
              className={`absolute text-[16px] text-[#314158] cursor-pointer select-none ${
                isSelected ? 'font-semibold' : 'font-normal'
              }`}
              style={{ left: `${48 + level * 40}px` }}
              onDoubleClick={e => {
                e.stopPropagation()
                startEditing(folder.id)
              }}
            >
              {folder.name}
            </p>
          )}
          {isSelected && (
            <div
              className="absolute right-3 cursor-pointer hover:opacity-70"
              onClick={e => {
                e.stopPropagation()
                deleteFolder(folder.id)
              }}
            >
              <Trash2 size={24} color="#020618" strokeWidth={1.5} />
            </div>
          )}
        </div>
        {folder.children.map(child => renderFolder(child, level + 1))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4">
      {/* logout */}
      <div className="max-w-[916px] mx-auto flex justify-end mb-6">
        <button
          className="text-[16px] font-semibold text-[#314158] hover:opacity-80 cursor-pointer bg-transparent border-0"
          onClick={() => {
            localStorage.removeItem('isAuthenticated')
            navigate('/login')
          }}
        >
          Wyloguj
        </button>
      </div>

      {/* tab bar */}
      <div className="max-w-[916px] mx-auto mb-3">
        <div className="bg-white border border-[#f1f5f9] rounded-[16px] px-2 py-2 flex gap-2 w-fit">
          <button
            onClick={() => setActiveTab('creator')}
            className={`h-[40px] px-4 rounded-[8px] text-[14px] text-[#314158] cursor-pointer border-0 transition-colors ${
              activeTab === 'creator' ? 'bg-[#e2e8f0] font-medium' : 'bg-[#f8fafc] font-normal'
            }`}
          >
            Kreator Folderów
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`h-[40px] px-4 rounded-[8px] text-[14px] text-[#314158] cursor-pointer border-0 transition-colors ${
              activeTab === 'templates' ? 'bg-[#e2e8f0] font-medium' : 'bg-[#f8fafc] font-normal'
            }`}
          >
            Szablony
          </button>
        </div>
      </div>

      {/* main panel */}
      <div className="max-w-[916px] mx-auto bg-white border border-[#e2e8f0] rounded-[16px]">
        {/* panel header */}
        <div className="bg-[#f1f5f9] rounded-tl-[16px] rounded-tr-[16px] h-[47px] px-8 flex items-center">
          {activeTab === 'creator' ? (
            editingName ? (
              <input
                type="text"
                value={tempName}
                autoFocus
                onChange={e => setTempName(e.target.value)}
                onBlur={updateTemplateName}
                onKeyDown={e => e.key === 'Enter' && updateTemplateName()}
                className="text-[14px] font-semibold text-[#314158] bg-white px-2 py-1 rounded border border-[#e2e8f0] outline-none"
              />
            ) : (
              <p
                className="text-[14px] font-semibold text-[#314158] cursor-pointer"
                onClick={() => setEditingName(true)}
              >
                {currentTemplate.name}
              </p>
            )
          ) : (
            <p className="text-[14px] font-semibold text-[#314158]">Lista Szablonów</p>
          )}
        </div>

        {/* content */}
        <div
          className="h-[420px] overflow-y-auto px-8 py-4"
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedFolderId(null)
          }}
        >
          {activeTab === 'creator' ? (
            currentTemplate.folders.length === 0 ? (
              <p className="text-[#94a3b8] text-[14px] text-center mt-20">
                Brak folderów. Kliknij "Dodaj folder" aby rozpocząć.
              </p>
            ) : (
              <div
                onClick={e => {
                  if (e.target === e.currentTarget) setSelectedFolderId(null)
                }}
              >
                {currentTemplate.folders.map(f => renderFolder(f, 0))}
              </div>
            )
          ) : templates.length === 0 ? (
            <p className="text-[#94a3b8] text-[14px] text-center mt-20">
              Brak zapisanych szablonów. Kliknij "Nowy Szablon" aby utworzyć pierwszy.
            </p>
          ) : (
            <div>
              {templates.map(template => (
                <div
                  key={template.id}
                  className={`relative flex items-center h-[40px] rounded-[8px] mb-2 cursor-pointer ${
                    selectedTemplateId === template.id ? 'bg-[#f8fafc]' : ''
                  }`}
                  onClick={() => setSelectedTemplateId(template.id)}
                  onDoubleClick={() => loadTemplate(template)}
                >
                  <div className="absolute left-3">
                    <Folders size={24} color="#3878D4" strokeWidth={2} />
                  </div>
                  <p className="absolute left-12 text-[16px] font-normal text-[#314158]">
                    {template.name}
                  </p>
                  {selectedTemplateId === template.id && (
                    <div
                      className="absolute right-3 cursor-pointer hover:opacity-70"
                      onClick={e => {
                        e.stopPropagation()
                        deleteTemplate(template.id)
                      }}
                    >
                      <Trash2 size={24} color="#020618" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* bottom buttons */}
      <div className="max-w-[916px] mx-auto mt-4 flex gap-3">
        {activeTab === 'creator' ? (
          <>
            <button
              onClick={addFolder}
              className="flex items-center gap-2 bg-[#1d293d] text-white text-[14px] px-3 h-[40px] rounded-[8px] cursor-pointer hover:opacity-90 border-0"
            >
              <FolderPlus size={24} color="white" strokeWidth={1.5} />
              Dodaj folder
            </button>
            <button
              onClick={saveTemplate}
              className="flex items-center bg-white text-[#020618] text-[14px] px-3 h-[40px] rounded-[8px] cursor-pointer hover:opacity-90 border border-[#e2e8f0]"
            >
              Zapisz Szablon
            </button>
            <button
              onClick={importFolders}
              disabled={currentTemplate.folders.length === 0}
              className={`flex items-center bg-[#1d293d] text-white text-[14px] px-3 h-[40px] rounded-[8px] border-0 ${
                currentTemplate.folders.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:opacity-90'
              }`}
            >
              Importuj Foldery
            </button>
          </>
        ) : (
          <button
            onClick={createNewTemplate}
            className="flex items-center gap-2 bg-[#1d293d] text-white text-[14px] px-3 h-[40px] rounded-[8px] cursor-pointer hover:opacity-90 border-0"
          >
            <FolderPlus size={24} color="white" strokeWidth={1.5} />
            Nowy Szablon
          </button>
        )}
      </div>
    </div>
  )
}
