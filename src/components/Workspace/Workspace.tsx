import BottomBar from '../BottomBar/BottomBar';
import CodeEditor from '../CodeEditor/CodeEditor';
import styles from './Workspace.module.css';

function Workspace() {
  return (
    <div className={styles.workspace} style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', minHeight: 0 }}>
        <CodeEditor />
      </div>
      <BottomBar />
    </div>
  );
}

export default Workspace;