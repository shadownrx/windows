import React, { createContext, useContext, useState, useEffect } from 'react';
import { genId } from '../utils/id';

export interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'drive';
  ext?: string;
  size?: string;
  modified: string;
  imageUrl?: string;
  capacity?: string;
  used?: string;
  parentId: string | null;
  content?: string;
  /** For .nex executables: which app to open and optional args */
  nexPayload?: { appId: string; title: string; args?: string[] };
  /** Special folder types for visual distinctions */
  folderType?: 'node_modules' | 'program_files' | 'normal';
}

interface FileSystemContextType {
  files: FileItem[];
  createFolder: (parentId: string, name: string) => void;
  createFile: (parentId: string, name: string, ext: string) => string;
  updateFileContent: (id: string, content: string) => void;
  deleteItem: (id: string) => void;
  renameItem: (id: string, newName: string) => void;
  copyItem: (id: string) => void;
  cutItem: (id: string) => void;
  pasteItem: (targetParentId: string) => void;
  clipboard: { id: string, type: 'copy' | 'cut' } | null;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

const INITIAL_FILES: FileItem[] = [
  { id: 'c-drive', name: 'Disco local (C:)', type: 'drive', capacity: '512', used: '245', modified: '10/01/2026', parentId: null },
  { id: 'desktop', name: 'Escritorio', type: 'folder', modified: '26/03/2026', parentId: 'c-drive' },
  { id: 'documents', name: 'Documentos', type: 'folder', modified: '25/03/2026', parentId: 'c-drive' },
  { id: 'downloads', name: 'Descargas', type: 'folder', modified: '24/03/2026', parentId: 'c-drive' },
  { id: 'pictures', name: 'Imágenes', type: 'folder', modified: '20/03/2026', parentId: 'c-drive' },
  { id: 'projects', name: 'Proyectos', type: 'folder', modified: '26/03/2026', parentId: 'documents' },
  { id: 'readme', name: 'README.txt', type: 'file', ext: 'txt', size: '2 KB', modified: '25/03/2026', parentId: 'documents' },
  { id: 'wallpaper', name: 'wallpaper.jpg', type: 'file', ext: 'jpg', size: '4.2 MB', modified: '01/03/2026', imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800', parentId: 'pictures' },
  // ── Program Files ────────────────────────────────────────────────────────
  { id: 'program-files', name: 'Program Files', type: 'folder', folderType: 'program_files', modified: '10/01/2026', parentId: 'c-drive' },
  { id: 'pf-nex', name: 'NEX', type: 'folder', folderType: 'program_files', modified: '10/01/2026', parentId: 'program-files' },
  // .nex executables inside C:\Program Files\NEX\
  { id: 'nex-notepad',     name: 'notepad',     type: 'file', ext: 'nex', size: '12 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'notepad',      title: 'Notepad' } },
  { id: 'nex-cmd',         name: 'cmd',         type: 'file', ext: 'nex', size: '28 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'cmd',          title: 'Terminal' } },
  { id: 'nex-browser',     name: 'browser',     type: 'file', ext: 'nex', size: '54 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'chrome',       title: 'Navegador' } },
  { id: 'nex-code',      name: 'vscode',      type: 'file', ext: 'nex', size: '89 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'vscode',       title: 'Visual Studio Code' } },
  { id: 'nex-explorer',    name: 'explorer',    type: 'file', ext: 'nex', size: '36 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'file-explorer', title: 'Explorador de archivos' } },
  { id: 'nex-paint',       name: 'paint',       type: 'file', ext: 'nex', size: '41 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'paint',        title: 'Paint' } },
  { id: 'nex-calc',        name: 'calc',        type: 'file', ext: 'nex', size: '8 KB',   modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'calculator',   title: 'Calculadora' } },
  { id: 'nex-taskmanager', name: 'taskmanager', type: 'file', ext: 'nex', size: '22 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'taskmanager',  title: 'Administrador de tareas' } },
  { id: 'nex-nexreproductor',     name: 'nexreproductor',     type: 'file', ext: 'nex', size: '67 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'nexreproductor',      title: 'NexReproductor' } },
  { id: 'nex-settings',    name: 'settings',    type: 'file', ext: 'nex', size: '18 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'settings',     title: 'Configuración' } },
  { id: 'nex-wordpad',     name: 'wordpad',     type: 'file', ext: 'nex', size: '31 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'wordpad',      title: 'WordPad' } },
  { id: 'nex-defender',    name: 'defender',    type: 'file', ext: 'nex', size: '44 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'defender',     title: 'Seguridad de Windows' } },
  { id: 'nex-mediaplayer', name: 'mediaplayer', type: 'file', ext: 'nex', size: '29 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'mediaplayer',  title: 'Reproductor multimedia' } },
  { id: 'nex-spotify',     name: 'spotify',     type: 'file', ext: 'nex', size: '35 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'spotify',      title: 'Spotify' } },
  { id: 'nex-devcpp',      name: 'devcpp',      type: 'file', ext: 'nex', size: '73 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'devcpp-2026',  title: 'Dev-C++ 2026' } },
  { id: 'nex-terminal',    name: 'terminal',    type: 'file', ext: 'nex', size: '28 KB',  modified: '10/01/2026', parentId: 'pf-nex', nexPayload: { appId: 'terminal',     title: 'Terminal' } },
];

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileItem[]>(() => {
    const saved = localStorage.getItem('win11_fs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if it has spotify.nex
        const hasSpotify = parsed.some((f: FileItem) => f.name === 'spotify' && f.ext === 'nex');
        return hasSpotify ? parsed : INITIAL_FILES;
      } catch (e) {
        return INITIAL_FILES;
      }
    }
    return INITIAL_FILES;
  });

  useEffect(() => {
    localStorage.setItem('win11_fs', JSON.stringify(files));
  }, [files]);

  const createFolder = (parentId: string, name: string) => {
    const newFolder: FileItem = {
      id: genId(),
      name,
      type: 'folder',
      modified: new Date().toLocaleDateString('es-ES'),
      parentId
    };
    setFiles([...files, newFolder]);
  };

  const createFile = (parentId: string, name: string, ext: string) => {
    const id = genId();
    const newFile: FileItem = {
      id,
      name,
      type: 'file',
      ext,
      size: '0 KB',
      modified: new Date().toLocaleDateString('es-ES'),
      parentId,
      content: ''
    };
    setFiles([...files, newFile]);
    return id;
  };

  const updateFileContent = (id: string, content: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, content, size: `${Math.max(1, Math.round(content.length / 1024))} KB`, modified: new Date().toLocaleDateString('es-ES') } : f));
  };

  const deleteItem = (id: string) => {
    // Función para obtener todos los IDs a borrar (incluyendo hijos)
    const getIdsToDelete = (targetId: string): string[] => {
      const children = files.filter(f => f.parentId === targetId);
      const childIds = children.flatMap(child => getIdsToDelete(child.id));
      return [targetId, ...childIds];
    };
    const idsToDelete = getIdsToDelete(id);
    setFiles(files.filter(f => !idsToDelete.includes(f.id)));
  };

  const renameItem = (id: string, newName: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  const [clipboard, setClipboard] = useState<{ id: string, type: 'copy' | 'cut' } | null>(null);

  const copyItem = (id: string) => setClipboard({ id, type: 'copy' });
  const cutItem = (id: string) => setClipboard({ id, type: 'cut' });

  const pasteItem = (targetParentId: string) => {
    if (!clipboard) return;
    const item = files.find(f => f.id === clipboard.id);
    if (!item) return;

    if (clipboard.type === 'copy') {
      const newItem: FileItem = {
        ...item,
        id: genId(),
        name: `${item.name} - Copia`,
        parentId: targetParentId,
        modified: new Date().toLocaleDateString('es-ES')
      };
      setFiles([...files, newItem]);
    } else {
      // Cut/Move
      setFiles(files.map(f => f.id === clipboard.id ? { ...f, parentId: targetParentId } : f));
      setClipboard(null);
    }
  };

  return (
    <FileSystemContext.Provider value={{ 
      files, createFolder, createFile, updateFileContent, deleteItem, renameItem,
      copyItem, cutItem, pasteItem, clipboard 
    }}>
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (!context) throw new Error('useFileSystem must be used within a FileSystemProvider');
  return context;
};
