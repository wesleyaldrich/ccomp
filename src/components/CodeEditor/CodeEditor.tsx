import styles from './CodeEditor.module.css'

function CodeEditor() {
    return (
        <div className={styles["code-editor"]}>
            <div className={styles["menu-top"]}></div>
            <div className={styles["menu-tabs"]}></div>
        </div>
    )
}

export default CodeEditor;
