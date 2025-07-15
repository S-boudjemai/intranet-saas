// src/components/MultiSelect.tsx
import { useState, useRef, useEffect } from "react";

// --- ICÔNES SVG ---
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);
const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
    />
  </svg>
);
// --- FIN ICÔNES SVG ---

type Option = {
  value: number;
  label: string;
};

interface MultiSelectProps {
  options: Option[];
  selectedValues: number[];
  onChange: (selected: number[]) => void;
  placeholder?: string;
}

export default function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = "Sélectionner...",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((opt) =>
    selectedValues.includes(opt.value)
  );

  const handleSelect = (value: number) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  // Ferme le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef]);

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="bg-input border border-border rounded-md w-full p-2 text-foreground flex items-center justify-between cursor-pointer min-h-[44px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <span
                key={option.value}
                className="flex items-center gap-1 bg-primary/20 text-primary text-sm font-medium px-2 py-1 rounded"
              >
                {option.label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Empêche l'ouverture/fermeture du dropdown
                    handleSelect(option.value);
                  }}
                  className="text-primary/70 hover:text-primary"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-muted-foreground px-1">{placeholder}</span>
          )}
        </div>
        <ChevronDownIcon
          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 top-full mt-2 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          <ul>
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className="p-3 hover:bg-accent cursor-pointer flex items-center justify-between"
              >
                <span
                  className={
                    selectedValues.includes(option.value)
                      ? "font-bold text-primary"
                      : "text-popover-foreground"
                  }
                >
                  {option.label}
                </span>
                {selectedValues.includes(option.value) && (
                  <svg
                    className="h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
