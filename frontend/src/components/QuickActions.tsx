// src/components/QuickActions.tsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PlusIcon, TicketIcon, UploadIcon, ClipboardIcon } from "./icons";

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Planifier audit",
      description: "Programmer un nouvel audit",
      icon: ClipboardIcon,
      onClick: () => navigate("/audits"),
      color: "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600",
    },
    {
      title: "Traiter tickets",
      description: "Gérer les demandes",
      icon: TicketIcon,
      onClick: () => navigate("/tickets"),
      color: "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border-green-200 dark:border-green-800",
      iconColor: "text-green-600",
    },
    {
      title: "Ajouter document",
      description: "Uploader un fichier",
      icon: UploadIcon,
      onClick: () => navigate("/documents"),
      color: "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800",
      iconColor: "text-purple-600",
    },
    {
      title: "Nouvelle annonce",
      description: "Diffuser une info",
      icon: PlusIcon,
      onClick: () => navigate("/announcements"),
      color: "bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-800",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card rounded-2xl p-6 border border-border shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-2 bg-primary rounded-full"></div>
        <h2 className="text-xl font-bold text-foreground">Actions rapides</h2>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={action.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.onClick}
            className={`
              ${action.color}
              border rounded-xl p-4 text-left
              transition-all duration-300
              hover:shadow-md
              group
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`
                p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm
                transition-transform duration-300
                group-hover:scale-110
              `}>
                <action.icon className={`w-5 h-5 ${action.iconColor}`} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">
              {action.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {action.description}
            </p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickActions;