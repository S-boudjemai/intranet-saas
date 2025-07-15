// src/components/ui/TabNavigation.tsx


export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export default function TabNavigation({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = '' 
}: TabNavigationProps) {
  return (
    <div className={`border-b border-border ${className}`}>
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              group relative min-w-0 overflow-hidden whitespace-nowrap
              py-4 px-1 text-sm font-medium transition-all duration-300
              focus:outline-none focus:ring-0 focus:border-0 outline-none
              ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              {tab.icon && (
                <span className={`
                  transition-colors duration-300
                  ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
                `}>
                  {tab.icon}
                </span>
              )}
              <span className="truncate">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span className={`
                  inline-flex h-5 min-w-[1.25rem] items-center justify-center
                  rounded-full px-1.5 text-xs font-semibold leading-5
                  transition-colors duration-300
                  ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground'
                  }
                `}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            
            {/* Soulignement seulement */}
            <div className={`
              absolute bottom-0 left-0 h-0.5 w-full origin-left transform transition-all duration-300
              ${
                activeTab === tab.id
                  ? 'scale-x-100 bg-primary'
                  : 'scale-x-0 bg-primary group-hover:scale-x-100 group-hover:bg-muted-foreground/30'
              }
            `} />
          </button>
        ))}
      </nav>
    </div>
  );
}