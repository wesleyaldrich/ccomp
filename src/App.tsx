import "./App.css";
import Workspace from "./components/Workspace/Workspace";
import SidebarLeft from "./components/SidebarLeft/SidebarLeft";
import SidebarRight from "./components/SidebarRight/SidebarRight";
import TitleBar from "./components/TitleBar/TitleBar";
import BottomBar from "./components/BottomBar/BottomBar";

function App() {
    return (
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <TitleBar />
            <div className="app-layout">
                <SidebarLeft />
                <Workspace />
                <SidebarRight />
                <BottomBar />
            </div>
        </div>
    );
}

export default App;
