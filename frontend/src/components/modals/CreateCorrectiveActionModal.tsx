import { useState, useEffect } from 'react';
import { FiX, FiUser, FiCalendar, FiDollarSign, FiFileText, FiAlertTriangle } from 'react-icons/fi';

interface User {
  id: number;
  name: string;
  role: string;
  email: string;
  restaurant_name?: string;
}

interface CreateCorrectiveActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (action: any) => void;
  nonConformities?: any[]; // Kept for compatibility but will be empty
  users: User[];
  preselectedNonConformity?: any; // Legacy prop, unused now
  editAction?: any; // Action à modifier (si fournie, on est en mode édition)
  isEditMode?: boolean; // Flag pour indiquer le mode édition
}

const ACTION_ORIGINS = [
  { value: 'audit', label: '📋 Suite à un audit', icon: '📋' },
  { value: 'incident', label: '🚨 Incident signalé', icon: '🚨' },
  { value: 'improvement', label: '📈 Amélioration continue', icon: '📈' },
  { value: 'quality_control', label: '🔍 Contrôle qualité', icon: '🔍' }
];

const ACTION_CATEGORIES = [
  { value: 'maintenance', label: '🔧 Réparation / Maintenance', icon: '🔧' },
  { value: 'training', label: '📚 Formation du personnel', icon: '📚' },
  { value: 'procedure', label: '📋 Mise à jour procédures', icon: '📋' },
  { value: 'equipment', label: '🛒 Achat d\'équipement', icon: '🛒' },
  { value: 'cleaning', label: '🧽 Nettoyage / Désinfection', icon: '🧽' },
  { value: 'quality', label: '📊 Contrôle qualité', icon: '📊' },
  { value: 'finance', label: '💰 Gestion financière', icon: '💰' }
];

const PRIORITIES = [
  { 
    value: 'critical', 
    label: '🔴 Critique', 
    color: 'text-red-600 bg-red-50 border-red-200',
    duration: '24h',
    description: 'Risque immédiat pour la sécurité/santé' 
  },
  { 
    value: 'urgent', 
    label: '🟡 Urgente', 
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    duration: '1 semaine',
    description: 'Impact significatif sur l\'activité' 
  },
  { 
    value: 'normal', 
    label: '🟢 Normale', 
    color: 'text-green-600 bg-green-50 border-green-200',
    duration: '1 mois',
    description: 'Amélioration standard' 
  },
  { 
    value: 'planned', 
    label: '🔵 Planifiée', 
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    duration: '3+ mois',
    description: 'Évolution long terme' 
  }
];

const RESOURCES = [
  { id: 'external_training', label: '📚 Formation externe' },
  { id: 'material_purchase', label: '🛒 Achat matériel' },
  { id: 'service_provider', label: '🔧 Intervention prestataire' },
  { id: 'staff_time', label: '👥 Temps personnel' },
  { id: 'documentation', label: '📄 Documentation' },
  { id: 'software', label: '💻 Logiciel/Application' }
];

// Actions prédéfinies par catégorie
const PREDEFINED_ACTIONS = {
  maintenance: [
    {
      title: "Réparation équipement défaillant",
      description: "Réparer ou remplacer l'équipement identifié comme défaillant",
      estimated_cost: "200-500€",
      typical_duration: 3
    },
    {
      title: "Maintenance préventive",
      description: "Programmer la maintenance préventive selon le planning constructeur",
      estimated_cost: "100-300€",
      typical_duration: 7
    }
  ],
  training: [
    {
      title: "Formation hygiène alimentaire",
      description: "Organiser formation HACCP pour l'équipe",
      estimated_cost: "300-600€",
      typical_duration: 7
    },
    {
      title: "Formation utilisation équipement",
      description: "Former le personnel à l'utilisation correcte des équipements",
      estimated_cost: "150-300€",
      typical_duration: 3
    }
  ],
  equipment: [
    {
      title: "Remplacement thermomètre",
      description: "Acheter thermomètre digital conforme aux normes",
      estimated_cost: "50-100€",
      typical_duration: 2
    },
    {
      title: "Installation système de surveillance",
      description: "Installer système de monitoring température automatique",
      estimated_cost: "500-1500€",
      typical_duration: 14
    }
  ]
};

export default function CreateCorrectiveActionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  nonConformities = [], 
  users,
  preselectedNonConformity,
  editAction,
  isEditMode = false
}: CreateCorrectiveActionModalProps) {
  const [step, setStep] = useState(1);
  const [action, setAction] = useState({
    title: '',
    description: '',
    origin: 'general',
    category: '',
    priority: 'normal',
    assigned_to: '',
    due_date: '',
    cost_estimate: '',
    resources_needed: [] as string[],
    restaurant_id: ''
  });

  // Initialiser avec les données d'édition si disponibles
  useEffect(() => {
    if (isEditMode && editAction) {
      setAction({
        title: editAction.action_description || '',
        description: editAction.action_description || '',
        origin: 'general', // Default value for existing actions
        category: 'maintenance', // Default category
        priority: 'normal', // Default priority
        assigned_to: editAction.assigned_to?.toString() || '',
        due_date: editAction.due_date ? new Date(editAction.due_date).toISOString().split('T')[0] : '',
        cost_estimate: '',
        resources_needed: [],
        restaurant_id: ''
      });
    } else if (!isEditMode) {
      // Reset form when creating new action
      setAction({
        title: '',
        description: '',
        origin: 'general',
        category: '',
        priority: 'normal',
        assigned_to: '',
        due_date: '',
        cost_estimate: '',
        resources_needed: [],
        restaurant_id: ''
      });
    }
  }, [isEditMode, editAction, isOpen]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPredefined, setShowPredefined] = useState(false);

  useEffect(() => {
    if (action.assigned_to) {
      const user = users.find(u => u.id === parseInt(action.assigned_to));
      setSelectedUser(user || null);
    }
  }, [action.assigned_to, users]);

  // Calculer la date d'échéance suggérée selon la priorité
  useEffect(() => {
    if (action.priority && !action.due_date) {
      const today = new Date();
      let days = 30; // par défaut
      
      switch (action.priority) {
        case 'critical': days = 1; break;
        case 'urgent': days = 7; break;
        case 'normal': days = 30; break;
        case 'planned': days = 90; break;
      }
      
      const dueDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
      setAction(prev => ({ ...prev, due_date: dueDate.toISOString().split('T')[0] }));
    }
  }, [action.priority]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const finalAction: any = {
      action_description: action.description,
      assigned_to: parseInt(action.assigned_to),
      due_date: action.due_date,
      notes: action.title // Using title as notes since backend expects notes field
    };

    // Si on est en mode édition, ajouter l'ID
    if (isEditMode && editAction) {
      finalAction.id = editAction.id;
    }

    onSubmit(finalAction);
    onClose();
  };

  const addResource = (resourceId: string) => {
    if (!action.resources_needed.includes(resourceId)) {
      setAction({
        ...action,
        resources_needed: [...action.resources_needed, resourceId]
      });
    }
  };

  const removeResource = (resourceId: string) => {
    setAction({
      ...action,
      resources_needed: action.resources_needed.filter(r => r !== resourceId)
    });
  };

  const applyPredefinedAction = (predefined: any) => {
    setAction({
      ...action,
      title: predefined.title,
      description: predefined.description,
      cost_estimate: predefined.estimated_cost.split('-')[0].replace(/[€\s]/g, '') // Prendre le minimum
    });
    
    // Calculer la date d'échéance
    const today = new Date();
    const dueDate = new Date(today.getTime() + predefined.typical_duration * 24 * 60 * 60 * 1000);
    setAction(prev => ({ ...prev, due_date: dueDate.toISOString().split('T')[0] }));
    
    setShowPredefined(false);
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {isEditMode ? 'Modifier Action Corrective' : 'Nouvelle Action Corrective'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Étape {step} sur 4
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b bg-muted">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-12 h-1 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
            <span className="w-8 text-center">Contexte</span>
            <span className="w-12"></span>
            <span className="w-8 text-center">Description</span>
            <span className="w-12"></span>
            <span className="w-8 text-center">Assignation</span>
            <span className="w-12"></span>
            <span className="w-8 text-center">Ressources</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6">
              {/* Origine de l'action */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Origine de l'action corrective</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ACTION_ORIGINS.map((origin) => (
                    <button
                      key={origin.value}
                      onClick={() => setAction({ ...action, origin: origin.value })}
                      className={`p-4 text-left rounded-lg border-2 transition-colors ${
                        action.origin === origin.value
                          ? 'border-primary bg-primary/10'
                          : 'border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="font-medium text-foreground">{origin.label}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Catégorie */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Catégorie de l'action</h3>
                <div className="grid grid-cols-2 gap-3">
                  {ACTION_CATEGORIES.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => {
                        setAction({ ...action, category: category.value });
                        setShowPredefined(true);
                      }}
                      className={`p-3 text-left rounded-lg border-2 transition-colors ${
                        action.category === category.value
                          ? 'border-primary bg-primary/10'
                          : 'border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="font-medium text-foreground">{category.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions prédéfinies */}
              {showPredefined && action.category && PREDEFINED_ACTIONS[action.category as keyof typeof PREDEFINED_ACTIONS] && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-3">Actions suggérées pour cette catégorie</h4>
                  <div className="space-y-3">
                    {PREDEFINED_ACTIONS[action.category as keyof typeof PREDEFINED_ACTIONS].map((predefined, index) => (
                      <div key={index} className="p-3 bg-background border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-foreground">{predefined.title}</h5>
                            <p className="text-sm text-muted-foreground mt-1">{predefined.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <span>💰 {predefined.estimated_cost}</span>
                              <span>📅 {predefined.typical_duration} jours</span>
                            </div>
                          </div>
                          <button
                            onClick={() => applyPredefinedAction(predefined)}
                            className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Utiliser
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowPredefined(false)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Créer une action personnalisée
                  </button>
                </div>
              )}

              {/* Formulaire de description */}
              {(!showPredefined || !PREDEFINED_ACTIONS[action.category as keyof typeof PREDEFINED_ACTIONS]) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Titre de l'action *
                    </label>
                    <input
                      type="text"
                      value={action.title}
                      onChange={(e) => setAction({ ...action, title: e.target.value })}
                      placeholder="Ex: Formation hygiène alimentaire"
                      className="w-full px-3 py-2 border bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description détaillée *
                    </label>
                    <textarea
                      value={action.description}
                      onChange={(e) => setAction({ ...action, description: e.target.value })}
                      placeholder="Décrivez précisément ce qui doit être fait, comment et pourquoi..."
                      rows={4}
                      className="w-full px-3 py-2 border bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {/* Priorité */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Priorité et assignation</h3>
                <div className="grid gap-3">
                  {PRIORITIES.map((priority) => (
                    <div
                      key={priority.value}
                      onClick={() => setAction({ ...action, priority: priority.value })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        action.priority === priority.value
                          ? 'border-primary bg-primary/10'
                          : 'border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-foreground">{priority.label}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                              {priority.duration}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{priority.description}</p>
                        </div>
                        {action.priority === priority.value && (
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Responsable */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Responsable assigné</h3>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setAction({ ...action, assigned_to: user.id.toString() })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        action.assigned_to === user.id.toString()
                          ? 'border-primary bg-primary/10'
                          : 'border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FiUser className="w-8 h-8 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium text-foreground">{user.name}</h4>
                            <p className="text-sm text-muted-foreground">{user.role}</p>
                            {user.restaurant_name && (
                              <p className="text-sm text-muted-foreground">{user.restaurant_name}</p>
                            )}
                          </div>
                        </div>
                        {action.assigned_to === user.id.toString() && (
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date d'échéance */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date d'échéance *
                </label>
                <input
                  type="date"
                  value={action.due_date}
                  onChange={(e) => setAction({ ...action, due_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Suggérée selon la priorité: {PRIORITIES.find(p => p.value === action.priority)?.duration}
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              {/* Coût estimé */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Coût estimé (optionnel)
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    value={action.cost_estimate}
                    onChange={(e) => setAction({ ...action, cost_estimate: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-3 py-2 border bg-background text-foreground placeholder:text-muted-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">€</span>
                </div>
              </div>

              {/* Ressources nécessaires */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Ressources nécessaires</h3>
                <div className="grid grid-cols-2 gap-3">
                  {RESOURCES.map((resource) => (
                    <label
                      key={resource.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        action.resources_needed.includes(resource.id)
                          ? 'border-primary bg-primary/10'
                          : 'border hover:border-muted-foreground'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={action.resources_needed.includes(resource.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            addResource(resource.id);
                          } else {
                            removeResource(resource.id);
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border rounded focus:ring-blue-500"
                      />
                      <span className="font-medium text-foreground">{resource.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Résumé */}
              <div className="bg-primary/10 p-4 rounded-lg border">
                <h4 className="font-medium text-foreground mb-3">📋 Résumé de l'action corrective</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Titre:</strong> {action.title}</p>
                  <p><strong>Catégorie:</strong> {ACTION_CATEGORIES.find(c => c.value === action.category)?.label}</p>
                  <p><strong>Priorité:</strong> {PRIORITIES.find(p => p.value === action.priority)?.label}</p>
                  <p><strong>Assigné à:</strong> {selectedUser?.name} ({selectedUser?.role})</p>
                  <p><strong>Date d'échéance:</strong> {new Date(action.due_date).toLocaleDateString('fr-FR')}</p>
                  {action.cost_estimate && (
                    <p><strong>Coût estimé:</strong> {action.cost_estimate}€</p>
                  )}
                  {action.resources_needed.length > 0 && (
                    <p><strong>Ressources:</strong> {action.resources_needed.length} éléments sélectionnés</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-muted">
          <button
            onClick={step === 1 ? onClose : prevStep}
            className="px-4 py-2 text-foreground bg-background border rounded-lg hover:bg-muted transition-colors"
          >
            {step === 1 ? 'Annuler' : 'Précédent'}
          </button>
          
          <div className="flex space-x-3">
            {step < 4 ? (
              <button
                onClick={nextStep}
                disabled={
                  (step === 2 && (!action.title || !action.description || !action.category)) ||
                  (step === 3 && (!action.assigned_to || !action.due_date || !action.priority))
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Créer l'action
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}