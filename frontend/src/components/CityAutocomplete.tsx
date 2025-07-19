// src/components/CityAutocomplete.tsx
import { useState, useRef, useEffect } from 'react';
import { frenchCities } from '../data/french-cities';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
  id?: string;
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = "Tapez le nom de votre ville...",
  required = false,
  className = "",
  label,
  id = "city-autocomplete"
}: CityAutocompleteProps) {
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filtrer les villes en fonction de la saisie
  useEffect(() => {
    if (value.length > 0) {
      const filtered = frenchCities.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10); // Limiter à 10 suggestions
      setFilteredCities(filtered);
      setShowSuggestions(filtered.length > 0);
      setActiveSuggestion(-1);
    } else {
      setFilteredCities([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSuggestionClick = (city: string) => {
    onChange(city);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < filteredCities.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0 && activeSuggestion < filteredCities.length) {
          handleSuggestionClick(filteredCities[activeSuggestion]);
        }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        break;
    }
  };

  const handleInputBlur = () => {
    // Délai pour permettre le clic sur une suggestion
    setTimeout(() => {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }, 150);
  };

  const handleInputFocus = () => {
    if (value.length > 0 && filteredCities.length > 0) {
      setShowSuggestions(true);
    }
  };

  const inputClasses = `bg-input border border-border rounded-md w-full p-3 text-gray-900 placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all ${className}`;

  return (
    <div className="relative">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-muted-foreground mb-2"
        >
          {label}
        </label>
      )}
      
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        required={required}
        className={inputClasses}
        autoComplete="off"
        role="combobox"
        aria-expanded={showSuggestions}
        aria-haspopup="listbox"
        aria-autocomplete="list"
      />

      {showSuggestions && filteredCities.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {filteredCities.map((city, index) => (
            <button
              key={city}
              type="button"
              onClick={() => handleSuggestionClick(city)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                index === activeSuggestion 
                  ? 'bg-accent text-accent-foreground' 
                  : 'text-foreground'
              }`}
              role="option"
              aria-selected={index === activeSuggestion}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}