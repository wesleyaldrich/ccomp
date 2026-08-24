import "./App.css";
import CodeEditor from "./components/CodeEditor/CodeEditor";
import SidebarLeft from "./components/SidebarLeft/SidebarLeft";
import SidebarRight from "./components/SidebarRight/SidebarRight";
import TitleBar from "./components/TitleBar/TitleBar";

function App() {
    return (
        <div className="app-container">
            <TitleBar />
            <div className="app-layout">
                <SidebarLeft />
                <CodeEditor />
                <SidebarRight />
            </div>
        </div>
    );
}

export default App;
