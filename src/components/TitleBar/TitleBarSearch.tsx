import { Search } from "lucide-react";
import styles from "./TitleBar.module.css";

interface TitleBarSearchProps {
  onClick?: () => void;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function TitleBarSearch({
  onClick,
  value,
  onChange,
  placeholder = "Search",
}: TitleBarSearchProps) {
  return (
    <div
      className={styles.search}
      role="search"
      onClick={onClick}
    >
      <Search className={styles.searchIcon} />

      <input
        type="text"
        className={styles.searchInput}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
    </div>
  );
}
