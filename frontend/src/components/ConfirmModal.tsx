// src/components/ConfirmModal.tsx
import { motion } from "framer-motion";
import { ExclamationTriangleIcon } from "./icons";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    // Overlay Waitify
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* Conteneur de la modale Waitify */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          duration: 0.4
        }}
        className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
        }}
      >
        <div className="p-6">
          <div className="flex items-start space-x-4">
            {/* Icône d'avertissement Waitify */}
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-2xl bg-destructive/10"
            >
              <ExclamationTriangleIcon
                className="h-6 w-6 text-destructive"
                aria-hidden="true"
              />
            </motion.div>

            <div className="flex-1">
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-bold text-card-foreground mb-2"
                id="modal-title"
              >
                {title}
              </motion.h3>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground leading-relaxed"
              >
                {children}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Boutons d'action Waitify */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-muted px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="px-4 py-2.5 text-sm font-medium text-muted-foreground bg-card border border-border rounded-xl hover:bg-accent hover:border-accent transition-all duration-300"
            onClick={onClose}
          >
            Annuler
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="px-4 py-2.5 text-sm font-medium text-destructive-foreground bg-destructive border border-destructive rounded-xl hover:bg-destructive/90 hover:border-destructive/90 transition-all duration-300 shadow-sm hover:shadow-md"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirmer
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
