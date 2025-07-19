// src/pages/AuditsPage.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import TabNavigation, { type Tab } from '../components/ui/TabNavigation';
import { ClipboardIcon, CalendarIcon, ExclamationTriangleIcon } from '../components/icons';

// Import des composants tab (à créer ensuite)
import TemplatesTab from '../components/audit/TemplatesTab';
import PlanningTab from '../components/audit/PlanningTab'; 
import ActionsTab from '../components/audit/ActionsTab';

export type AuditTabId = 'templates' | 'planning' | 'actions';

export default function AuditsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<AuditTabId>('templates');

  // Sync avec URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab') as AuditTabId;
    if (tabParam && ['templates', 'planning', 'actions'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    const newTab = tabId as AuditTabId;
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const tabs: Tab[] = [
    {
      id: 'templates',
      label: 'Templates',
      icon: <ClipboardIcon className="h-5 w-5" />,
      // badge: templateStats?.total || 0, // TODO: Ajouter stats si nécessaire
    },
    {
      id: 'planning',
      label: 'Planning',
      icon: <CalendarIcon className="h-5 w-5" />,
      // badge: planningStats?.pending || 0, // TODO: Ajouter stats si nécessaire
    },
    {
      id: 'actions',
      label: 'Actions Correctives',
      icon: <ExclamationTriangleIcon className="h-5 w-5" />,
      // badge: actionsStats?.pending || 0, // TODO: Ajouter stats si nécessaire
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'templates':
        return <TemplatesTab />;
      case 'planning':
        return <PlanningTab />;
      case 'actions':
        return <ActionsTab />;
      default:
        return <TemplatesTab />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="p-3 bg-primary/10 border border-primary/20 rounded-2xl"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
          >
            <ClipboardIcon className="h-6 w-6 text-primary" />
          </motion.div>
          <span>Audits & Conformité</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Gestion complète des audits, planification et actions correctives
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-card border border-border rounded-lg"
      >
        <div className="px-6 pt-6">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Tab Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="p-6"
        >
          <div className="animate-tab-content">
            {renderTabContent()}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}