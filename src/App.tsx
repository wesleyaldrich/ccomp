import 'flexlayout-react/style/dark.css';
import "./App.css";
import Workspace from "./components/Workspace/Workspace";
import SidebarLeft from "./components/SidebarLeft/SidebarLeft";
import SidebarRight from "./components/SidebarRight/SidebarRight";
import TitleBar from "./components/TitleBar/TitleBar";
import { useRestoreSession } from './hooks/session/useRestoreSession';
import { openFileFromDisk } from './components/CodeEditor/fileActions';

function App() {
  useRestoreSession();

  return (
    <div className="app-container">
      <TitleBar />
      <div className="app-layout">
        <SidebarLeft onSelectFile={openFileFromDisk} />
        <Workspace />
        <SidebarRight />
      </div>
    </div>
  );
}

export default App;