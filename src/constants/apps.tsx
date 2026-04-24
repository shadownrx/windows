import React from 'react';
import {
  Folder24Regular,
  Search24Regular,
  Edit24Regular,
  Settings24Regular,
  Document24Regular,
  Apps24Regular,
  Calendar24Regular,
  ShieldCheckmark24Regular,
} from '@fluentui/react-icons';
import FileExplorer from '../components/apps/FileExplorer';
import BrowserApp, { ChromeIcon } from '../components/apps/BrowserApp';
import Vscode from '../components/apps/VsCode';
import Paint from '../components/apps/Paint';
import WordPad from '../components/apps/WordPad';
import TaskManager from '../components/apps/TaskManager';
import ControlPanel from '../components/apps/ControlPanel';
import Calendar from '../components/apps/Calendar';
import SearchApp from '../components/apps/SearchApp';
import WindowsDefender from '../components/apps/WindowsDefender';
import Calculator from '../components/apps/Calculator';
import Notepad from '../components/apps/Notepad';
import Cmd from '../components/apps/Cmd';

export interface AppItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  component: (props: any) => React.ReactNode;
}

export const APPS: AppItem[] = [
  { id: 'search', icon: <Search24Regular />, label: 'Buscar', component: (props) => <SearchApp {...props} /> },
  { id: 'files', icon: <Folder24Regular />, label: 'Explorador de archivos', component: (props) => <FileExplorer {...props} /> },
  { id: 'chrome', icon: <ChromeIcon />, label: 'Google Chrome', component: (props) => <BrowserApp {...props} /> },
  { 
    id: 'vscode', 
    icon: (
      <svg viewBox="0 0 100 100" width="24" height="24">
        <path d="M74.9 10.4L50 35.3l-11-11L10 42.8v14.4l11-8.2 11 11 28-28.9V74l-11-8-11 11 28.9 13L90 79V21z" fill="#007ACC"/>
      </svg>
    ), 
    label: 'VS Code', 
    component: (props) => <Vscode {...props} /> 
  },
  { id: 'paint', icon: <Edit24Regular />, label: 'Paint', component: (props) => <Paint {...props} /> },
  { id: 'control-panel', icon: <Settings24Regular />, label: 'Configuración', component: (props) => <ControlPanel {...props} /> },
  { id: 'wordpad', icon: <Document24Regular />, label: 'WordPad', component: (props) => <WordPad {...props} /> },
  { id: 'task-manager', icon: <Apps24Regular />, label: 'Administrador de tareas', component: (props) => <TaskManager {...props} /> },
  { id: 'calendar', icon: <Calendar24Regular />, label: 'Calendario', component: (props) => <Calendar {...props} /> },
  { id: 'defender', icon: <ShieldCheckmark24Regular />, label: 'Seguridad de Windows', component: (props) => <WindowsDefender {...props} /> },
  { id: 'calculator', icon: <Apps24Regular />, label: 'Calculadora', component: (props) => <Calculator {...props} /> },
  { id: 'notepad', icon: <Document24Regular />, label: 'Bloc de notas', component: (props) => <Notepad {...props} /> },
  { id: 'terminal', icon: <span style={{ fontFamily: 'Consolas, monospace', fontSize: 16 }}>C:\\</span>, label: 'Terminal', component: (props) => <Cmd {...props} /> },
];
