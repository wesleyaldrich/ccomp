import { Search } from "lucide-react";

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
      className="titlebar__search"
      role="search"
      onClick={onClick}
    >
      <Search className="titlebar__search-icon" />

      <input
        type="text"
        className="titlebar__search-input"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
    </div>
  );
}
