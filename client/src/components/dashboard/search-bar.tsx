import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onFilter?: () => void;
  showFilter?: boolean;
  className?: string;
}

export function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
  onFilter,
  showFilter = false,
  className
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`pl-10 ${value ? 'pr-10' : ''} transition-all duration-200 ${
            isFocused ? 'ring-2 ring-blue-500/20' : ''
          }`}
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      
      {showFilter && onFilter && (
        <Button
          variant="outline"
          size="sm"
          onClick={onFilter}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      )}
    </div>
  );
}
