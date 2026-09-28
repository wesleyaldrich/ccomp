import { useState } from 'react';
import styles from './BottomBar.module.css'

function BottomBar() {

    /* The current active menu */
        const [activeMenu, setActiveMenu] = useState<string | null>(null)

    /* Adjustable bottom bar height */
    const [bottomBarHeight, setBottomBarHeight] = useState(260)

    /*  This method handles the logic to correctly handle
        active state when toggling between menus. */
    function toggleState(menu: string) {
        setActiveMenu(current =>
            current === menu ? null : menu
        )
    }

    return (
        <div className={styles["bottom-bar"]}>
            <div className={styles["header"]}>

            </div>
            <div className={styles["content"]}>
                
            </div>
        </div>
    )
}

export default BottomBar;
