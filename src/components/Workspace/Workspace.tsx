import BottomBar from '../BottomBar/BottomBar';
import CodeEditor from '../CodeEditor/CodeEditor';
import styles from './Workspace.module.css'

function Workspace() {
    return (
        <div className={styles["workspace"]}>
            <CodeEditor />
            <BottomBar />
        </div>
    )
}

export default Workspace;
