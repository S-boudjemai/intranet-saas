// src/components/CategoryTree.tsx
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ChevronRightIcon } from "../components/icons";
import { CategoryTreeSkeleton } from "./Skeleton";

interface Category {
  id: string;
  name: string;
  hasChildren?: boolean;
}

interface Props {
  selectedId?: string;
  onSelect: (id: string) => void;
}

export default function CategoryTree({ selectedId, onSelect }: Props) {
  const { token } = useAuth();
  const [roots, setRoots] = useState<Category[] | null>(null);
  const [childrenMap, setChildrenMap] = useState<Record<string, Category[]>>(
    {}
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Fetch root categories
  useEffect(() => {
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        const data = json.data || json;
        Array.isArray(data) && setRoots(data);
      })
      .catch(() => setRoots([]));
  }, [token]);

  // Fetch children on demand
  const fetchChildren = useCallback((parentId: string) => {
    if (!token || childrenMap[parentId]) return;
    fetch(`${import.meta.env.VITE_API_URL}/categories?parentId=${parentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        const data = json.data || json;
        Array.isArray(data)
          ? setChildrenMap((prev) => ({ ...prev, [parentId]: data }))
          : null;
      })
      .catch(() => {
        setChildrenMap((prev) => ({ ...prev, [parentId]: [] }));
      });
  }, [token, childrenMap]);

  const handleToggle = (nodeId: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      fetchChildren(nodeId);
      newExpanded.add(nodeId);
    }
    setExpanded(newExpanded);
  };

  // Recursively render nodes
  const renderNodes = (nodes: Category[]) => {
    return nodes.map((node) => {
      const isExpanded = expanded.has(node.id);
      const kids = childrenMap[node.id] || [];
      const isSelected = node.id === selectedId;

      return (
        <div key={node.id} className="relative">
          {/* Vertical connector line for all but the last item */}
          <div className="absolute top-0 left-[9px] w-px h-full bg-border"></div>

          <div className="flex items-center space-x-1 relative z-10">
            {/* Toggle button with rotating chevron */}
            <button
              onClick={() => handleToggle(node.id)}
              className="p-1 rounded-full hover:bg-secondary text-muted-foreground"
            >
              <ChevronRightIcon
                className={`h-4 w-4 transition-transform duration-300 ${
                  isExpanded ? "rotate-90" : ""
                }`}
              />
            </button>

            {/* Selectable label */}
            <button
              onClick={() => onSelect(node.id)}
              className={`
                px-2 py-1 rounded-md text-left w-full
                transition-colors duration-200
                ${
                  isSelected
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/80 hover:bg-secondary"
                }
              `}
            >
              {node.name}
            </button>
          </div>

          {/* Children container with smooth expand/collapse animation */}
          <div
            className={`
              pl-4 overflow-hidden transition-all duration-500 ease-in-out
              ${isExpanded ? "max-h-[1000px]" : "max-h-0"}
            `}
          >
            {renderNodes(kids)}
          </div>
        </div>
      );
    });
  };

  if (roots === null) {
    return <CategoryTreeSkeleton />;
  }

  return <div>{renderNodes(roots)}</div>;
}
