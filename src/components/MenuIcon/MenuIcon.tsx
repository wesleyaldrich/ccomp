import styles from './MenuIcon.module.css'

type MenuProps = {
    icon: React.ReactNode
    iconActive: React.ReactNode
    active: boolean
    onClick: () => void
}

function MenuIcon({ icon, iconActive, active, onClick }: MenuProps) {
    return (
        <div className={styles["icon-container"]}>
            <button
                className={`${styles["menu-icon"]} ${active ? styles.active : ""}`}
                onClick={onClick}
            >
                {active ? iconActive : icon}
            </button>
        </div>
    )
}

export default MenuIcon;
