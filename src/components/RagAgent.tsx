import React, { useState } from 'react';
import { Database, Plus, Trash2, Edit2, Check, RefreshCw, AlertCircle, FileText, UploadCloud, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSynthSound } from '@/app/page';

interface DocumentNode {
  id: string;
  name: string;
  size: string;
  chunks: number;
  uploadedAt: string;
}

interface RagAgentProps {
  isMuted?: boolean;
}

export default function RagAgent({ isMuted = false }: RagAgentProps) {
  const [collections, setCollections] = useState<string[]>(['Main Knowledge Base', 'NextJS Docs', 'Developer Guide']);
  const [activeCollection, setActiveCollection] = useState<string>('Main Knowledge Base');
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  
  // Document lists inside active collection
  const [documents, setDocuments] = useState<Record<string, DocumentNode[]>>({
    'Main Knowledge Base': [
      { id: '1', name: 'Cresent_AI_Architecture.pdf', size: '2.4 MB', chunks: 142, uploadedAt: '10 Jun 2026' },
      { id: '2', name: 'User_DNA_calibrations.txt', size: '148 KB', chunks: 18, uploadedAt: '11 Jun 2026' },
    ],
    'NextJS Docs': [
      { id: '3', name: 'rendering_strategies.pdf', size: '4.8 MB', chunks: 312, uploadedAt: '08 Jun 2026' },
    ],
    'Developer Guide': [],
  });

  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ingestion States
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'checking'>('connected');

  const triggerStatusCheck = () => {
    playSynthSound('scan', isMuted);
    setConnectionStatus('checking');
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 1200);
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    const name = newCollectionName.trim();
    playSynthSound('success', isMuted);
    setCollections(prev => [...prev, name]);
    setDocuments(prev => ({ ...prev, [name]: [] }));
    setActiveCollection(name);
    setNewCollectionName('');
    setShowAddCollection(false);
  };

  const handleDeleteCollection = (name: string) => {
    if (collections.length <= 1) return;
    playSynthSound('delete', isMuted);
    setCollections(prev => prev.filter(c => c !== name));
    if (activeCollection === name) {
      setActiveCollection(collections.find(c => c !== name) || '');
    }
  };

  const startUploadSim = (fileName: string) => {
    playSynthSound('scan', isMuted);
    setUploadingFile(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const newDoc: DocumentNode = {
              id: Math.random().toString(),
              name: fileName,
              size: '1.2 MB',
              chunks: Math.floor(Math.random() * 80) + 20,
              uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            };
            setDocuments(prevDocs => ({
              ...prevDocs,
              [activeCollection]: [...(prevDocs[activeCollection] || []), newDoc],
            }));
            setUploadingFile(false);
            playSynthSound('success', isMuted);
          }, 400);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  const handleDeleteDoc = (id: string) => {
    playSynthSound('delete', isMuted);
    setDocuments(prev => ({
      ...prev,
      [activeCollection]: prev[activeCollection].filter(d => d.id !== id),
    }));
  };

  const handleSaveDocEdit = (id: string) => {
    if (!editingDocName.trim()) return;
    playSynthSound('success', isMuted);
    setDocuments(prev => ({
      ...prev,
      [activeCollection]: prev[activeCollection].map(d => d.id === id ? { ...d, name: editingDocName } : d),
    }));
    setEditingDocId(null);
  };

  const activeDocs = documents[activeCollection] || [];
  const filteredDocs = activeDocs.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col gap-5 text-neutral-800 dark:text-neutral-200 font-sans antialiased">
      {/* Target API sync status */}
      <div className="p-4 brutal-card bg-[var(--card-bg)] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-[var(--accent-primary)]' : 'bg-red-500 animate-pulse'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase">RAG Backend Sync</span>
            <span className="text-xs font-semibold font-mono text-neutral-500">ragify-eight.vercel.app</span>
          </div>
        </div>
        <button
          onClick={triggerStatusCheck}
          disabled={connectionStatus === 'checking'}
          className="p-1.5 rounded-lg border border-[var(--border-color)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all cursor-pointer bg-[var(--card-bg)]"
          title="Refresh connection status"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus === 'checking' ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Collection Selection & CRUD */}
      <div className="p-4.5 brutal-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-450 dark:text-neutral-400 font-mono">Index Collection</label>
          <button
            onClick={() => { playSynthSound('click', isMuted); setShowAddCollection(!showAddCollection); }}
            className="text-[10px] uppercase font-bold text-[var(--accent-primary)] hover:underline flex items-center gap-1 font-mono cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Collection
          </button>
        </div>

        <AnimatePresence>
          {showAddCollection && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreateCollection}
              className="flex gap-2 items-center overflow-hidden border-b border-[var(--border-color)]/30 pb-3"
            >
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection title..."
                className="flex-1 text-xs brutal-input bg-[var(--input-bg)] border border-[var(--border-color)] outline-none py-1.5 px-3 rounded-lg"
              />
              <button
                type="submit"
                className="py-1.5 px-3 bg-[var(--accent-primary)] text-white text-xs font-semibold rounded-lg shadow-sm hover:opacity-90 cursor-pointer"
              >
                Create
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2">
          {collections.map(c => {
            const isActive = activeCollection === c;
            return (
              <div
                key={c}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  isActive 
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)] font-bold' 
                    : 'border-[var(--border-color)] bg-[var(--card-bg)] text-neutral-600 dark:text-neutral-300 hover:border-neutral-400'
                }`}
              >
                <button
                  onClick={() => { playSynthSound('click', isMuted); setActiveCollection(c); }}
                  className="flex-1 text-left text-xs font-semibold cursor-pointer"
                >
                  {c}
                </button>
                {collections.length > 1 && (
                  <button
                    onClick={() => handleDeleteCollection(c)}
                    className="p-1 text-neutral-400 hover:text-red-500 rounded cursor-pointer transition-colors"
                    title="Delete Collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* File Uploader Target */}
      <div className="p-4.5 brutal-card flex flex-col gap-3.5">
        <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-450 dark:text-neutral-400 font-mono">Ingest Documents</label>
        
        {uploadingFile ? (
          <div className="p-6 border-2 border-dashed border-[var(--accent-primary)]/40 rounded-xl bg-[var(--card-bg)] flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-[var(--accent-primary)] animate-spin mb-3" />
            <span className="text-xs font-bold font-mono text-neutral-600 dark:text-neutral-300">Splitting and Indexing document...</span>
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-4 overflow-hidden max-w-[200px]">
              <div 
                className="bg-[var(--accent-primary)] h-full transition-all duration-150" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const file = e.dataTransfer.files[0];
              if (file) startUploadSim(file.name);
            }}
            className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              dragActive 
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5' 
                : 'border-[var(--border-color)] bg-[var(--card-bg)] hover:border-neutral-400'
            }`}
            onClick={() => {
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.onchange = (e: any) => {
                const file = e.target.files[0];
                if (file) startUploadSim(file.name);
              };
              fileInput.click();
            }}
          >
            <UploadCloud className="w-8 h-8 text-neutral-400 mb-2" />
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Drag & drop or Click to upload</span>
            <span className="text-[9px] text-neutral-400 font-mono mt-1">Accepts PDF, TXT, MD, DOCX</span>
          </div>
        )}
      </div>

      {/* CRUD Searchable Document Index List */}
      <div className="p-4.5 brutal-card flex flex-col gap-3.5">
        <div className="flex flex-col gap-2.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-450 dark:text-neutral-400 font-mono">Ingested Knowledge Base</label>
          
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search index database..."
              className="w-full text-xs brutal-input pl-9 pr-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] outline-none rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {filteredDocs.length === 0 ? (
              <span className="text-xs text-neutral-400 italic text-center py-4">No documents stored in database</span>
            ) : (
              filteredDocs.map((doc) => {
                const isEditing = editingDocId === doc.id;
                return (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3 border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0 mr-3">
                      <FileText className="w-4.5 h-4.5 text-[var(--accent-primary)] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0 flex flex-col">
                        {isEditing ? (
                          <div className="flex gap-1 items-center">
                            <input
                              type="text"
                              value={editingDocName}
                              onChange={(e) => setEditingDocName(e.target.value)}
                              className="text-xs brutal-input bg-[var(--input-bg)] py-0.5 px-2 border border-[var(--border-color)] outline-none rounded flex-1"
                            />
                            <button
                              onClick={() => handleSaveDocEdit(doc.id)}
                              className="p-1 bg-[var(--accent-primary)] text-white rounded cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-bold truncate text-[var(--foreground)]">{doc.name}</span>
                            <span className="text-[9px] text-neutral-400 font-mono mt-0.5">{doc.size} • {doc.chunks} chunks • {doc.uploadedAt}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { playSynthSound('click', isMuted); setEditingDocId(doc.id); setEditingDocName(doc.name); }}
                          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-450 dark:text-neutral-400 rounded cursor-pointer transition-colors"
                          title="Edit Metadata"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-450 dark:text-neutral-400 hover:text-red-500 rounded cursor-pointer transition-colors"
                          title="Delete index document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
