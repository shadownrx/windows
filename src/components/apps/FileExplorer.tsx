import React, { useState, useRef, useEffect } from 'react';
import {
  Folder20Filled,
  Document20Regular,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  ArrowUp20Regular,
  Search20Regular,
  Grid28Regular,
  List20Regular,
  TextColumnTwoLeft20Regular,
  Add20Regular,
  Cut20Regular,
  Copy20Regular,
  ClipboardPaste20Regular,
  Delete20Regular,
  Rename20Regular,
  Share20Regular,
  ArrowSort20Regular,
  Home20Regular,
  Desktop20Regular,
  MusicNote220Regular,
  Image20Regular,
  Video20Regular,
  ArrowDownload20Regular,
  HardDrive20Regular,
  ChevronRight12Regular,
  DocumentPdf20Regular,
  TableSimple20Regular,
} from '@fluentui/react-icons';

import { useWindowManager } from '../../context/WindowManager';
import ContextMenu, { type ContextMenuOption } from '../ContextMenu';
import ImageViewer from './ImageViewer';
import Notepad from './Notepad';

interface FileItem {
  name: string;
  type: 'folder' | 'file' | 'drive';
  ext?: string;
  size?: string;
  modified?: string;
  imageUrl?: string;
  capacity?: string;
  used?: string;
  free?: string;
}

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  files: FileItem[];
}

let fileSystemRevision = 0;
const emitFsUpdate = () => { fileSystemRevision++; window.dispatchEvent(new Event('fs-update')); };
let fsClipboard: { action: 'copy'|'cut', path: string, items: FileItem[] } | null = null;

let LOCATIONS: Record<string, FileItem[]> = {
  'Home': [
    { name: 'Disco local (C:)', type: 'drive', capacity: '512', used: '245', modified: '10/01/2026' },
    { name: 'Desktop', type: 'folder', modified: '26/03/2026' },
    { name: 'Documents', type: 'folder', modified: '25/03/2026' },
    { name: 'Downloads', type: 'folder', modified: '24/03/2026' },
    { name: 'Pictures', type: 'folder', modified: '20/03/2026' },
    { name: 'Music', type: 'folder', modified: '15/03/2026' },
    { name: 'Videos', type: 'folder', modified: '10/03/2026' },
  ],
  'Desktop': [
    { name: 'Projects', type: 'folder', modified: '26/03/2026' },
    { name: 'Acceso directo a Chrome', type: 'file', ext: 'lnk', size: '1 KB', modified: '01/01/2026' },
  ],
  'C:': [
    { name: 'Windows', type: 'folder', modified: '10/03/2026' },
    { name: 'Program Files', type: 'folder', modified: '09/03/2026' },
    { name: 'Users', type: 'folder', modified: '08/03/2026' },
    { name: 'ProgramData', type: 'folder', modified: '08/03/2026' },
  ],
  'Documents': [
    { name: 'Projects', type: 'folder', modified: '26/03/2026' },
    { name: 'Design', type: 'folder', modified: '20/03/2026' },
    { name: 'Invoices', type: 'folder', modified: '18/03/2026' },
    { name: 'README.txt', type: 'file', ext: 'txt', size: '2 KB', modified: '25/03/2026' },
    { name: 'Budget.xlsx', type: 'file', ext: 'xlsx', size: '48 KB', modified: '22/03/2026' },
    { name: 'Presentation.pptx', type: 'file', ext: 'pptx', size: '3.2 MB', modified: '19/03/2026' },
    { name: 'Report Q1.pdf', type: 'file', ext: 'pdf', size: '1.1 MB', modified: '15/03/2026' },
  ],
  'Downloads': [
    { name: 'Setup.exe', type: 'file', ext: 'exe', size: '54 MB', modified: '24/03/2026' },
    { name: 'archive.zip', type: 'file', ext: 'zip', size: '12 MB', modified: '23/03/2026' },
    { name: 'photo.jpg', type: 'file', ext: 'jpg', size: '3.4 MB', modified: '22/03/2026' },
  ],
  'Pictures': [
    { name: 'Vacation 2025', type: 'folder', modified: '10/01/2026' },
    { name: 'wallpaper.jpg', type: 'file', ext: 'jpg', size: '4.2 MB', modified: '01/03/2026', imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800' },
    { name: 'screenshot.png', type: 'file', ext: 'png', size: '800 KB', modified: '20/03/2026', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' },
    { name: 'landscape.jpg', type: 'file', ext: 'jpg', size: '2.8 MB', modified: '15/02/2026', imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800' },
    { name: 'city_night.jpg', type: 'file', ext: 'jpg', size: '3.1 MB', modified: '10/02/2026', imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800' },
    { name: 'forest.png', type: 'file', ext: 'png', size: '5.0 MB', modified: '05/01/2026', imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800' },
    { name: 'mountains.jpg', type: 'file', ext: 'jpg', size: '2.3 MB', modified: '20/12/2025', imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800' },
  ],
  'Music': [],
  'Videos': [],
};

const getFileIcon = (item: FileItem, small = false) => {
  const sz = small ? 16 : 20;
  if (item.type === 'drive') return <HardDrive20Regular style={{ color: '#7fa4f1', fontSize: sz }} />;
  if (item.type === 'folder') return <Folder20Filled style={{ color: '#f0c040', fontSize: sz }} />;
  // Image thumbnail
  if ((item.ext === 'jpg' || item.ext === 'png') && item.imageUrl) {
    return <img src={item.imageUrl} alt={item.name}
      style={{ width: small ? 20 : 40, height: small ? 20 : 40, objectFit: 'cover', borderRadius: 3 }} />;
  }
  switch (item.ext) {
    case 'pdf': return <DocumentPdf20Regular style={{ color: '#d9534f', fontSize: sz }} />;
    case 'xlsx': return <TableSimple20Regular style={{ color: '#1a7a40', fontSize: sz }} />;
    case 'pptx': return <Document20Regular style={{ color: '#c0451a', fontSize: sz }} />;
    case 'txt': return <Document20Regular style={{ color: '#9aa0a6', fontSize: sz }} />;
    case 'jpg': case 'png': return <Image20Regular style={{ color: '#1a78c2', fontSize: sz }} />;
    case 'mp3': return <MusicNote220Regular style={{ color: '#7b68ee', fontSize: sz }} />;
    case 'zip': case 'exe': return <Document20Regular style={{ color: '#9aa0a6', fontSize: sz }} />;
    default: return <Document20Regular style={{ color: '#9aa0a6', fontSize: sz }} />;
  }
};

const FileExplorer: React.FC = () => {
  const { openWindow } = useWindowManager();
  const [history, setHistory] = useState<string[]>(['Home']);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'icons' | 'list' | 'details'>('icons');
  const [selected, setSelected] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const addressRef = useRef<HTMLInputElement>(null);

  const [rev, setRev] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: FileItem | null } | null>(null);
  const [renamingItem, setRenamingItem] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  useEffect(() => {
    const handleFsUpdate = () => setRev(r => r + 1);
    window.addEventListener('fs-update', handleFsUpdate);
    return () => window.removeEventListener('fs-update', handleFsUpdate);
  }, []);

  const currentPath = history[historyIdx];
  const files = LOCATIONS[currentPath] ?? [];

  const canBack = historyIdx > 0;
  const canForward = historyIdx < history.length - 1;

  const navigate = (path: string) => {
    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
    setSelected(null);
  };

  const goBack = () => { if (canBack) { setHistoryIdx(h => h - 1); setSelected(null); } };
  const goForward = () => { if (canForward) { setHistoryIdx(h => h + 1); setSelected(null); } };
  const goUp = () => { if (currentPath !== 'Home') navigate('Home'); };

  const getUniqueName = (base: string, ext: string = '') => {
    let name = ext ? `${base}.${ext}` : base;
    let i = 1;
    while (files.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      name = ext ? `${base} (${i}).${ext}` : `${base} (${i})`;
      i++;
    }
    return name;
  };

  const handleNewFolder = () => {
    if (!LOCATIONS[currentPath]) LOCATIONS[currentPath] = [];
    LOCATIONS[currentPath].push({ name: getUniqueName('Nueva carpeta'), type: 'folder', modified: new Date().toLocaleDateString() });
    emitFsUpdate();
  };

  const handleNewFile = () => {
    if (!LOCATIONS[currentPath]) LOCATIONS[currentPath] = [];
    LOCATIONS[currentPath].push({ name: getUniqueName('Nuevo documento', 'txt'), type: 'file', ext: 'txt', size: '0 KB', modified: new Date().toLocaleDateString() });
    emitFsUpdate();
  };

  const handleDelete = (itemName: string) => {
    LOCATIONS[currentPath] = LOCATIONS[currentPath].filter(f => f.name !== itemName);
    if (selected === itemName) setSelected(null);
    emitFsUpdate();
  };

  const startRename = (itemName: string) => {
    setRenamingItem(itemName);
    setRenameInput(itemName);
  };

  const commitRename = () => {
    if (renamingItem && renameInput.trim() && renameInput !== renamingItem) {
        if (!files.some(f => f.name.toLowerCase() === renameInput.toLowerCase())) {
            const file = LOCATIONS[currentPath].find(f => f.name === renamingItem);
            if (file) {
                file.name = renameInput.trim();
                if (file.type === 'file' && file.name.includes('.')) {
                    file.ext = file.name.split('.').pop() || '';
                }
            }
        }
    }
    setRenamingItem(null);
    emitFsUpdate();
  };

  const handleDoubleClick = (item: FileItem) => {
    if (item.type === 'drive') {
      navigate('C:');
    } else if (item.type === 'folder' && LOCATIONS[item.name] !== undefined) {
      navigate(item.name);
    } else if ((item.ext === 'jpg' || item.ext === 'png') && item.imageUrl) {
      const imageFiles = files.filter(f => f.imageUrl).map(f => ({ name: f.name, imageUrl: f.imageUrl! }));
      const idx = imageFiles.findIndex(f => f.name === item.name);
      
      const windowId = `imageviewer-${Date.now()}`;
      openWindow(
        windowId,
        `Fotos - ${item.name}`,
        <Image20Regular />,
        <ImageViewer files={imageFiles} initialIndex={Math.max(0, idx)} />
      );
    } else if (item.ext === 'txt') {
      openWindow(
        `notepad-${item.name}`,
        item.name,
        <Document20Regular />,
        <Notepad />
      );
    } else {
      openWindow(
        `app-${item.name}`,
        item.name,
        <Document20Regular />,
        <div className="p-4" style={{ color: 'white' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>{item.name}</h2>
          <p>This file type ({item.ext}) doesn't have a default app associated with it in this simulation.</p>
        </div>
      );
    }
  };

  const breadcrumbs = currentPath === 'Home' ? ['Este equipo'] : ['Este equipo', currentPath];

  useEffect(() => {
    if (editingAddress && addressRef.current) {
      addressRef.current.focus();
      addressRef.current.select();
    }
  }, [editingAddress]);

  const sidebarSections: { title: string; items: SidebarItem[] }[] = [
    {
      title: 'Acceso rápido',
      items: [
        { label: 'Inicio', icon: <Home20Regular />, path: 'Home', files: [] },
        { label: 'Escritorio', icon: <Desktop20Regular />, path: 'Desktop', files: [] },
        { label: 'Documentos', icon: <Document20Regular />, path: 'Documents', files: [] },
        { label: 'Descargas', icon: <ArrowDownload20Regular />, path: 'Downloads', files: [] },
        { label: 'Imágenes', icon: <Image20Regular />, path: 'Pictures', files: [] },
        { label: 'Música', icon: <MusicNote220Regular />, path: 'Music', files: [] },
        { label: 'Videos', icon: <Video20Regular />, path: 'Videos', files: [] },
      ]
    },
    {
      title: 'Este equipo',
      items: [
        { label: 'Disco local (C:)', icon: <HardDrive20Regular />, path: 'C:', files: [] },
      ]
    }
  ];

  const handlePaste = () => {
    if (fsClipboard) {
        fsClipboard.items.forEach(item => {
            const base = item.name.includes('.') ? item.name.substring(0, item.name.lastIndexOf('.')) : item.name;
            const newName = getUniqueName(base, item.ext);
            LOCATIONS[currentPath].push({ ...item, name: newName });
        });
        if (fsClipboard.action === 'cut') {
            LOCATIONS[fsClipboard.path] = LOCATIONS[fsClipboard.path].filter(f => !fsClipboard!.items.some(i => i.name === f.name));
            fsClipboard = null;
        }
        emitFsUpdate();
    }
  };

  const ribbonButtons = [
    { icon: <Add20Regular />, label: 'Nuevo', onClick: handleNewFolder },
    { icon: <Cut20Regular />, label: 'Cortar', disabled: !selected, onClick: () => { if(selected) { fsClipboard = { action: 'cut', path: currentPath, items: [files.find(f => f.name === selected)!] }; emitFsUpdate(); } } },
    { icon: <Copy20Regular />, label: 'Copiar', disabled: !selected, onClick: () => { if(selected) { fsClipboard = { action: 'copy', path: currentPath, items: [files.find(f => f.name === selected)!] }; emitFsUpdate(); } } },
    { icon: <ClipboardPaste20Regular />, label: 'Pegar', disabled: !fsClipboard, onClick: handlePaste },
    { icon: <Rename20Regular />, label: 'Renombrar', disabled: !selected, onClick: () => selected && startRename(selected) },
    { icon: <Share20Regular />, label: 'Compartir', disabled: !selected, onClick: () => {} },
    { icon: <Delete20Regular />, label: 'Eliminar', disabled: !selected, onClick: () => selected && handleDelete(selected) },
    { divider: true, onClick: () => {} },
    { icon: <ArrowSort20Regular />, label: 'Ordenar', onClick: () => {} },
  ];

  const handleBgContextMenu = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    setSelected(null);
    setContextMenu({ x: e.clientX, y: e.clientY, item: null });
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(item.name);
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  return (
    <>
    <div className="fe2-root">
      {/* Ribbon */}
      <div className="fe2-ribbon">
        {ribbonButtons.map((btn, i) =>
          (btn as any).divider ? (
            <div key={i} className="fe2-ribbon-div" />
          ) : (
            <button key={i} className={`fe2-ribbon-btn ${(btn as any).disabled ? 'fe2-disabled' : ''}`} title={(btn as any).label} onClick={(btn as any).onClick}>
              <span className="fe2-ribbon-icon">{(btn as any).icon}</span>
              <span className="fe2-ribbon-label">{(btn as any).label}</span>
            </button>
          )
        )}
        <div style={{ flex: 1 }} />
        <div className="fe2-view-toggle">
          <button className={`fe2-view-btn ${viewMode === 'icons' ? 'active' : ''}`} onClick={() => setViewMode('icons')} title="Iconos"><Grid28Regular /></button>
          <button className={`fe2-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="Lista"><List20Regular /></button>
          <button className={`fe2-view-btn ${viewMode === 'details' ? 'active' : ''}`} onClick={() => setViewMode('details')} title="Detalles"><TextColumnTwoLeft20Regular /></button>
        </div>
      </div>

      {/* Toolbar: Nav + Address + Search */}
      <div className="fe2-toolbar">
        <button className={`fe2-nav-btn ${!canBack ? 'fe2-disabled' : ''}`} onClick={goBack} title="Atrás"><ChevronLeft20Regular /></button>
        <button className={`fe2-nav-btn ${!canForward ? 'fe2-disabled' : ''}`} onClick={goForward} title="Adelante"><ChevronRight20Regular /></button>
        <button className={`fe2-nav-btn ${currentPath === 'Home' ? 'fe2-disabled' : ''}`} onClick={goUp} title="Arriba"><ArrowUp20Regular /></button>

        {editingAddress ? (
          <input
            ref={addressRef}
            className="fe2-address-input"
            value={addressInput}
            onChange={e => setAddressInput(e.target.value)}
            onBlur={() => setEditingAddress(false)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const target = Object.keys(LOCATIONS).find(k => k.toLowerCase() === addressInput.toLowerCase());
                if (target) navigate(target);
                setEditingAddress(false);
              }
              if (e.key === 'Escape') setEditingAddress(false);
            }}
          />
        ) : (
          <div className="fe2-breadcrumb" onClick={() => { setAddressInput(currentPath); setEditingAddress(true); }}>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight12Regular className="fe2-bc-sep" />}
                <span
                  className="fe2-bc-item"
                  onClick={e => { e.stopPropagation(); if (i === 0) navigate('Home'); }}
                >{crumb}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="fe2-search-box">
          <Search20Regular className="fe2-search-icon" />
          <input type="text" placeholder={`Buscar en ${currentPath}`} className="fe2-search-input" />
        </div>
      </div>

      {/* Body */}
      <div className="fe2-body">
        {/* Sidebar */}
        <div className="fe2-sidebar">
          {sidebarSections.map((section) => (
            <div key={section.title} className="fe2-sidebar-section">
              <div className="fe2-sidebar-title">{section.title}</div>
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className={`fe2-sidebar-item ${currentPath === item.path ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="fe2-sidebar-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="fe2-main" onClick={() => setSelected(null)} onContextMenu={handleBgContextMenu}>
          {currentPath === 'C:' && (
            <div className="fe2-drive-summary">
              <div className="fe2-drive-summary-title">Disco local (C:)</div>
              <div className="fe2-drive-summary-stats">
                <span>{LOCATIONS['C:']?.length ?? 0} carpetas</span>
                <span>Libre: {Math.max(0, (512 - 245))} GB</span>
                <span>Utilizado: 245 GB</span>
              </div>
              <div className="fe2-drive-summary-bar">
                <div className="fe2-drive-summary-bar-used" style={{ width: '48%' }} />
              </div>
            </div>
          )}
          {viewMode === 'icons' && (
            <div className="fe2-grid">
              {files.map((item) => {
                const isDrive = item.type === 'drive';
                return (
                <div
                  key={item.name}
                  className={`fe2-icon-item ${selected === item.name ? 'fe2-selected' : ''} ${isDrive ? 'fe2-drive-item' : ''}`}
                  onClick={e => { e.stopPropagation(); setSelected(item.name); }}
                  onDoubleClick={() => handleDoubleClick(item)}
                  onContextMenu={e => handleItemContextMenu(e, item)}
                >
                  <div className="fe2-icon">{getFileIcon(item)}</div>
                  {isDrive ? (
                    <div className="fe2-drive-detail">
                      <div className="fe2-drive-name">{item.name}</div>
                      <div className="fe2-drive-meta">{item.used ?? '245 GB'} de {item.capacity ?? '512 GB'} usados</div>
                      <div className="fe2-drive-bar">
                        <div className="fe2-drive-bar-used" style={{ width: item.used ? `${(parseInt(item.used) / parseInt(item.capacity ?? '512')) * 100}%` : '48%' }} />
                      </div>
                    </div>
                  ) : renamingItem === item.name ? (
                    <input autoFocus value={renameInput} onChange={e => setRenameInput(e.target.value)} onBlur={commitRename} onKeyDown={e => e.key === 'Enter' && commitRename()} onClick={e => e.stopPropagation()} className="fe2-rename-input" />
                  ) : (
                    <div className="fe2-icon-label">{item.name}</div>
                  )}
                </div>
              );
            })}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="fe2-list">
              {files.map((item) => (
                <div
                  key={item.name}
                  className={`fe2-list-item ${selected === item.name ? 'fe2-selected' : ''}`}
                  onClick={e => { e.stopPropagation(); setSelected(item.name); }}
                  onDoubleClick={() => handleDoubleClick(item)}
                  onContextMenu={e => handleItemContextMenu(e, item)}
                >
                  <span className="fe2-list-icon">{getFileIcon(item)}</span>
                  {renamingItem === item.name ? (
                      <input autoFocus value={renameInput} onChange={e => setRenameInput(e.target.value)} onBlur={commitRename} onKeyDown={e => e.key === 'Enter' && commitRename()} onClick={e => e.stopPropagation()} className="fe2-rename-input-list" />
                  ) : (
                      <span>{item.name}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {viewMode === 'details' && (
            <div className="fe2-details">
              <div className="fe2-details-header">
                <span className="fe2-col-name">Nombre</span>
                <span className="fe2-col-date">Fecha de modif.</span>
                <span className="fe2-col-type">Tipo</span>
                <span className="fe2-col-size">Tamaño</span>
              </div>
              {files.map((item) => (
                <div
                  key={item.name}
                  className={`fe2-details-row ${selected === item.name ? 'fe2-selected' : ''}`}
                  onClick={e => { e.stopPropagation(); setSelected(item.name); }}
                  onDoubleClick={() => handleDoubleClick(item)}
                  onContextMenu={e => handleItemContextMenu(e, item)}
                >
                  <span className="fe2-col-name fe2-details-name">
                    <span className="fe2-list-icon">{getFileIcon(item)}</span>
                    {renamingItem === item.name ? (
                        <input autoFocus value={renameInput} onChange={e => setRenameInput(e.target.value)} onBlur={commitRename} onKeyDown={e => e.key === 'Enter' && commitRename()} onClick={e => e.stopPropagation()} className="fe2-rename-input-list" />
                    ) : (
                        item.name
                    )}
                  </span>
                  <span className="fe2-col-date">{item.modified ?? '—'}</span>
                  <span className="fe2-col-type">{item.type === 'drive' ? 'Disco local' : item.type === 'folder' ? 'Carpeta de archivos' : item.ext?.toUpperCase() ?? 'Archivo'}</span>
                  <span className="fe2-col-size">{item.type === 'drive' ? item.used ? `${item.used} GB/${item.capacity} GB` : '—' : item.type === 'folder' ? '' : item.size ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="fe2-statusbar">
        {selected
          ? `1 elemento seleccionado`
          : `${files.length} elemento${files.length !== 1 ? 's' : ''}`}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          options={contextMenu.item ? [
            { label: 'Abrir', onClick: () => handleDoubleClick(contextMenu.item!) },
            { divider: true, onClick: () => {} },
            { label: 'Cortar', icon: <Cut20Regular />, onClick: () => { fsClipboard = { action: 'cut', path: currentPath, items: [contextMenu.item!] }; emitFsUpdate(); } },
            { label: 'Copiar', icon: <Copy20Regular />, onClick: () => { fsClipboard = { action: 'copy', path: currentPath, items: [contextMenu.item!] }; emitFsUpdate(); } },
            { label: 'Eliminar', icon: <Delete20Regular />, onClick: () => handleDelete(contextMenu.item!.name) },
            { label: 'Renombrar', icon: <Rename20Regular />, onClick: () => startRename(contextMenu.item!.name) },
          ] : [
            { label: 'Ver', onClick: () => {} },
            { label: 'Ordenar por', onClick: () => {} },
            { label: 'Actualizar', onClick: () => emitFsUpdate() },
            { divider: true, onClick: () => {} },
            { label: 'Pegar', icon: <ClipboardPaste20Regular />, disabled: !fsClipboard, onClick: handlePaste },
            { divider: true, onClick: () => {} },
            { label: 'Nuevo', submenu: [
                { label: 'Carpeta', icon: <Folder20Filled />, onClick: handleNewFolder },
                { label: 'Documento de texto', icon: <Document20Regular />, onClick: handleNewFile }
            ], onClick: () => {} },
          ]}
        />
      )}

      <style>{`
        .fe2-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #202020;
          color: rgba(255,255,255,0.9);
          font-size: 12px;
          font-family: 'Segoe UI Variable', 'Segoe UI', sans-serif;
          overflow: hidden;
        }

        /* Ribbon */
        .fe2-ribbon {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 4px 8px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .fe2-ribbon-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 5px 8px;
          border-radius: 5px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.85);
          cursor: pointer;
          font-size: 11px;
          min-width: 44px;
          transition: background 0.1s;
        }
        .fe2-ribbon-btn:hover { background: rgba(255,255,255,0.08); }
        .fe2-ribbon-icon { font-size: 18px; display: flex; }
        .fe2-ribbon-label { font-size: 10px; color: rgba(255,255,255,0.65); }
        .fe2-ribbon-div {
          width: 1px;
          height: 36px;
          background: rgba(255,255,255,0.08);
          margin: 0 4px;
        }
        .fe2-disabled { opacity: 0.35; pointer-events: none; }
        .fe2-view-toggle { display: flex; gap: 2px; }
        .fe2-view-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 5px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-size: 16px;
          transition: background 0.1s;
        }
        .fe2-view-btn:hover { background: rgba(255,255,255,0.08); }
        .fe2-view-btn.active { background: rgba(255,255,255,0.12); color: white; }

        /* Toolbar */
        .fe2-toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.015);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .fe2-nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 5px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.8);
          cursor: pointer;
          font-size: 16px;
          transition: background 0.1s;
          flex-shrink: 0;
        }
        .fe2-nav-btn:hover { background: rgba(255,255,255,0.08); }
        .fe2-breadcrumb {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 5px;
          height: 28px;
          cursor: text;
          transition: border-color 0.15s;
        }
        .fe2-breadcrumb:hover { border-color: rgba(255,255,255,0.18); }
        .fe2-bc-item {
          font-size: 12px;
          color: rgba(255,255,255,0.85);
          cursor: pointer;
        }
        .fe2-bc-item:hover { color: white; text-decoration: underline; }
        .fe2-bc-sep { color: rgba(255,255,255,0.4); flex-shrink: 0; }
        .fe2-address-input {
          flex: 1;
          height: 28px;
          background: rgba(255,255,255,0.08);
          border: 1px solid #0078d4;
          border-radius: 5px;
          color: white;
          font-size: 12px;
          padding: 0 10px;
          outline: none;
        }
        .fe2-search-box {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 5px;
          padding: 4px 10px;
          height: 28px;
          width: 200px;
          flex-shrink: 0;
          transition: border-color 0.15s;
        }
        .fe2-search-box:focus-within { border-color: #0078d4; }
        .fe2-search-icon { color: rgba(255,255,255,0.4); font-size: 14px; flex-shrink: 0; }
        .fe2-search-input {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.85);
          font-size: 12px;
          width: 100%;
          outline: none;
        }
        .fe2-search-input::placeholder { color: rgba(255,255,255,0.3); }

        /* Body */
        .fe2-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        /* Sidebar */
        .fe2-sidebar {
          width: 200px;
          flex-shrink: 0;
          overflow-y: auto;
          padding: 8px 4px;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .fe2-sidebar-section { margin-bottom: 8px; }
        .fe2-sidebar-title {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          padding: 6px 10px 3px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .fe2-sidebar-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 10px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 12px;
          color: rgba(255,255,255,0.8);
          transition: background 0.1s;
        }
        .fe2-sidebar-item:hover { background: rgba(255,255,255,0.07); }
        .fe2-sidebar-item.active { background: rgba(255,255,255,0.1); color: white; }
        .fe2-sidebar-icon { font-size: 16px; display: flex; align-items: center; color: rgba(255,255,255,0.65); }

        /* Main */
        .fe2-main {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        /* Icons view */
        .fe2-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px;
        }
        .fe2-icon-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.1s;
        }
        .fe2-icon-item:hover { background: rgba(255,255,255,0.07); }
        .fe2-icon-item.fe2-selected { background: rgba(0,120,212,0.25); outline: 1px solid rgba(0,120,212,0.5); }
        .fe2-drive-item { background: rgba(55, 95, 160, 0.22); border: 1px solid rgba(130, 170, 255, 0.35); }
        .fe2-drive-detail { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; color: #e5edff; }
        .fe2-drive-summary { padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(25, 45, 80, 0.32); margin-bottom: 10px; }
        .fe2-drive-summary-title { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
        .fe2-drive-summary-stats { display: flex; gap: 12px; font-size: 11px; opacity: 0.8; margin-bottom: 6px; }
        .fe2-drive-summary-bar { width: 100%; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.15); overflow: hidden; }
        .fe2-drive-summary-bar-used { height: 100%; background: linear-gradient(90deg, #6398ff, #2f6ed7); }
        .fe2-drive-name { font-weight: 700; }
        .fe2-drive-meta { color: rgba(255,255,255,0.75); }
        .fe2-drive-bar { width: 100%; height: 6px; background: rgba(255,255,255,0.15); border-radius: 3px; overflow: hidden; }
        .fe2-drive-bar-used { height: 100%; background: linear-gradient(90deg, #4aa5ff, #1d6aff); }
        .fe2-icon { font-size: 32px; display: flex; align-items: center; }
        .fe2-icon-label { font-size: 11px; text-align: center; word-break: break-word; line-height: 1.3; max-height: 2.6em; overflow: hidden; }

        /* List view */
        .fe2-list { display: flex; flex-direction: column; gap: 1px; }
        .fe2-list-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 8px;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.1s;
          font-size: 12px;
        }
        .fe2-list-item:hover { background: rgba(255,255,255,0.07); }
        .fe2-list-item.fe2-selected { background: rgba(0,120,212,0.25); }
        .fe2-list-icon { font-size: 18px; display: flex; align-items: center; flex-shrink: 0; }

        /* Details view */
        .fe2-details { display: flex; flex-direction: column; }
        .fe2-details-header {
          display: flex;
          align-items: center;
          padding: 5px 8px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: sticky;
          top: 0;
          background: #202020;
        }
        .fe2-details-row {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.1s;
        }
        .fe2-details-row:hover { background: rgba(255,255,255,0.06); }
        .fe2-details-row.fe2-selected { background: rgba(0,120,212,0.25); }
        .fe2-details-name { display: flex; align-items: center; gap: 8px; }
        .fe2-col-name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fe2-col-date { width: 130px; flex-shrink: 0; color: rgba(255,255,255,0.6); }
        .fe2-col-type { width: 150px; flex-shrink: 0; color: rgba(255,255,255,0.6); }
        .fe2-col-size { width: 80px; flex-shrink: 0; color: rgba(255,255,255,0.6); text-align: right; }

        /* Status bar */
        .fe2-statusbar {
          padding: 4px 16px;
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.015);
          flex-shrink: 0;
        }
        .fe2-rename-input {
          width: 100%;
          font-size: 11px;
          background: white;
          color: black;
          border: 1px solid #0078d4;
          text-align: center;
          padding: 2px;
          outline: none;
        }
        .fe2-rename-input-list {
          flex: 1;
          font-size: 12px;
          background: white;
          color: black;
          border: 1px solid #0078d4;
          padding: 2px 4px;
          outline: none;
        }
      `}</style>
    </div>
    </>
  );
};

export default FileExplorer;
