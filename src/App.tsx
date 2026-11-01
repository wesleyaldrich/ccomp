import 'flexlayout-react/style/dark.css';
import "./App.css";
import Workspace from "./components/Workspace/Workspace";
import SidebarLeft from "./components/SidebarLeft/SidebarLeft";
import SidebarRight from "./components/SidebarRight/SidebarRight";
import TitleBar from "./components/TitleBar/TitleBar";
import BottomBar from "./components/BottomBar/BottomBar";
import { useRestoreSession } from './hooks/session/useRestoreSession';
import { openFileFromDisk } from './components/CodeEditor/fileActions';

function App() {
    useRestoreSession();
    return (
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <TitleBar />
            <div className="app-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <SidebarLeft onSelectFile={openFileFromDisk} />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        <Workspace />
                        <SidebarRight />
                    </div>
                    <BottomBar />
                </div>
            </div>
        </div>
    );
}

export default App;
