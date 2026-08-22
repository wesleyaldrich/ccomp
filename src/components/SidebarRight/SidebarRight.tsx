import styles from './SidebarRight.module.css'

function SidebarRight() {
    return (
        <div className={styles["sidebar-right"]}>
            <div className={styles["menu-expanded"]}></div>
            <div className={styles["menu-icons"]}></div>
        </div>
    )
}

export default SidebarRight;
