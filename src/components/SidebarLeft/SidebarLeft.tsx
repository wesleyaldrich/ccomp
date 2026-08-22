import styles from './SidebarLeft.module.css'

function SidebarLeft() {
    return (
        <div className={styles["sidebar-left"]}>
            <div className={styles["menu-icons"]}></div>
            <div className={styles["menu-expanded"]}></div>
        </div>
    )
}

export default SidebarLeft;
