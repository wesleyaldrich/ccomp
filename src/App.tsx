import "./App.css";
import CodeEditor from "./components/CodeEditor/CodeEditor";
import SidebarLeft from "./components/SidebarLeft/SidebarLeft";
import SidebarRight from "./components/SidebarRight/SidebarRight";

function App() {
    return (
        <div className="app-container">
            <div className="app-layout">
                <SidebarLeft />
                <CodeEditor />
                <SidebarRight />
            </div>
        </div>
    );
}

export default App;
