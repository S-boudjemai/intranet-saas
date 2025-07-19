import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';

// Types pour les résultats de recherche
interface SearchResult {
  id: string;
  title: string;
  type: 'document' | 'ticket' | 'announcement';
  description?: string;
  created_at: string;
  restaurant_name?: string;
}

interface SearchResponse {
  documents: SearchResult[];
  tickets: SearchResult[];
  announcements: SearchResult[];
  total: number;
}

// Icônes SVG
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
  </svg>
);

const DocumentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5A6.375 6.375 0 003 11.625v2.25A2.25 2.25 0 005.25 16.5h13.5a2.25 2.25 0 002.25-2.25z" />
  </svg>
);

const TicketIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
  </svg>
);

const AnnouncementIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.375l-.188 1.436a23.716 23.716 0 01-4.026 6.155M3.24 18.615a23.716 23.716 0 004.025-6.155L7.077 11" />
  </svg>
);

const GlobalSearch: React.FC = () => {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Raccourci clavier Ctrl+K
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fonction de recherche avec debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      if (!token) return;
      
      setIsLoading(true);
      try {
        
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/search?q=${encodeURIComponent(query)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        
        if (response.ok) {
          const responseData = await response.json();
          // L'API retourne {success: true, data: {...}}, on extrait data
          const data = responseData.data || responseData;
          setResults(data);
        } else {
          const errorData = await response.text();
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [query, token]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'document': return <DocumentIcon className="h-4 w-4" />;
      case 'ticket': return <TicketIcon className="h-4 w-4" />;
      case 'announcement': return <AnnouncementIcon className="h-4 w-4" />;
      default: return <SearchIcon className="h-4 w-4" />;
    }
  };

  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case 'document': return '/documents';
      case 'ticket': return '/tickets';
      case 'announcement': return '/announcements';
      default: return '/';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'document': return 'Document';
      case 'ticket': return 'Ticket';
      case 'announcement': return 'Annonce';
      default: return '';
    }
  };

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;
    
    // Sanitize le texte d'entrée pour éviter les attaques XSS
    const sanitizedText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    const sanitizedQuery = DOMPurify.sanitize(searchQuery, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    
    if (!sanitizedText || !sanitizedQuery) return text;
    
    // Échapper le searchQuery pour éviter l'injection regex
    const escapedQuery = sanitizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = sanitizedText.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-900">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Rechercher... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-64 pl-10 pr-4 py-2 text-sm bg-input border border-border rounded-md focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none transition-all"
        />
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Dropdown des résultats */}
      {isOpen && (query.length >= 2 || results) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Recherche en cours...
            </div>
          ) : results && results.total > 0 ? (
            <div className="p-2">
              {/* Documents */}
              {results.documents.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Documents ({results.documents.length})
                  </div>
                  {results.documents.map((result) => (
                    <Link
                      key={`doc-${result.id}`}
                      to={getResultLink(result)}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {getResultIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {highlightText(result.title, query)}
                        </div>
                        {result.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {highlightText(result.description, query)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getTypeLabel(result.type)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Tickets */}
              {results.tickets.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tickets ({results.tickets.length})
                  </div>
                  {results.tickets.map((result) => (
                    <Link
                      key={`ticket-${result.id}`}
                      to={getResultLink(result)}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {getResultIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {highlightText(result.title, query)}
                        </div>
                        {result.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {highlightText(result.description, query)}
                          </div>
                        )}
                        {result.restaurant_name && (
                          <div className="text-xs text-sky-400 truncate">
                            {result.restaurant_name}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getTypeLabel(result.type)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Annonces */}
              {results.announcements.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Annonces ({results.announcements.length})
                  </div>
                  {results.announcements.map((result) => (
                    <Link
                      key={`announcement-${result.id}`}
                      to={getResultLink(result)}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {getResultIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {highlightText(result.title, query)}
                        </div>
                        {result.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {highlightText(result.description, query)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getTypeLabel(result.type)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : query.length >= 2 && !isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Aucun résultat trouvé pour "{query}"
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Tapez au moins 2 caractères pour rechercher
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;