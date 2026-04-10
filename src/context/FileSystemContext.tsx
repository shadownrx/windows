import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

interface FileSystemContextType {
  files: FileItem[];
  createFolder: (parentId: string, name: string) => void;
  createFile: (parentId: string, name: string, ext: string) => void;
  deleteItem: (id: string) => void;
  renameItem: (id: string, newName: string) => void;
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
];

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileItem[]>(() => {
    const saved = localStorage.getItem('win11_fs');
    return saved ? JSON.parse(saved) : INITIAL_FILES;
  });

  useEffect(() => {
    localStorage.setItem('win11_fs', JSON.stringify(files));
  }, [files]);

  const createFolder = (parentId: string, name: string) => {
    const newFolder: FileItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'folder',
      modified: new Date().toLocaleDateString('es-ES'),
      parentId
    };
    setFiles([...files, newFolder]);
  };

  const createFile = (parentId: string, name: string, ext: string) => {
    const newFile: FileItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'file',
      ext,
      size: '0 KB',
      modified: new Date().toLocaleDateString('es-ES'),
      parentId
    };
    setFiles([...files, newFile]);
  };

  const deleteItem = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const renameItem = (id: string, newName: string) => {
    setFiles(files.map(f => f.id === id ? { ...f, name: newName } : f));
  };

  return (
    <FileSystemContext.Provider value={{ files, createFolder, createFile, deleteItem, renameItem }}>
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (!context) throw new Error('useFileSystem must be used within a FileSystemProvider');
  return context;
};
