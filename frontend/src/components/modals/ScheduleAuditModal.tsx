import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiUser, FiFileText, FiClock, FiAlertTriangle } from 'react-icons/fi';

interface Template {
  id: number;
  name: string;
  category: string;
  estimated_duration: number;
  question_count: number;
  last_used?: string;
}

interface Restaurant {
  id: number;
  name: string;
  city: string;
  last_audit?: string;
  audit_score?: number;
}

interface Inspector {
  id: number;
  name: string;
  role: string;
  email: string;
  available: boolean;
}

interface ScheduleAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (audit: any) => void;
  templates: Template[];
  restaurants: Restaurant[];
  inspectors: Inspector[];
}

const PRIORITIES = [
  { value: 'urgent', label: '🔴 Urgente', color: 'text-red-600', description: 'Suite à incident' },
  { value: 'normal', label: '🟡 Normale', color: 'text-yellow-600', description: 'Planification standard' },
  { value: 'scheduled', label: '🟢 Programmée', color: 'text-green-600', description: 'Audit de routine' }
];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Unique' },
  { value: 'weekly', label: 'Chaque semaine' },
  { value: 'biweekly', label: 'Toutes les 2 semaines' },
  { value: 'monthly', label: 'Chaque mois' },
  { value: 'quarterly', label: 'Chaque trimestre' }
];

export default function ScheduleAuditModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  templates, 
  restaurants, 
  inspectors 
}: ScheduleAuditModalProps) {
  const [step, setStep] = useState(1);
  const [audit, setAudit] = useState({
    template_id: '',
    restaurant_id: '',
    inspector_id: '',
    scheduled_date: '',
    scheduled_time: '',
    priority: 'normal',
    notes: '',
    recurrence: 'none',
    notification_settings: {
      notify_7_days: true,
      notify_24_hours: true,
      notify_1_hour: false,
      notify_manager: true,
      notify_team: true,
      notify_regional: false
    }
  });

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedInspector, setSelectedInspector] = useState<Inspector | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);

  useEffect(() => {
    if (audit.template_id) {
      const template = templates.find(t => t.id === parseInt(audit.template_id));
      setSelectedTemplate(template || null);
    }
  }, [audit.template_id, templates]);

  useEffect(() => {
    if (audit.restaurant_id) {
      const restaurant = restaurants.find(r => r.id === parseInt(audit.restaurant_id));
      setSelectedRestaurant(restaurant || null);
    }
  }, [audit.restaurant_id, restaurants]);

  useEffect(() => {
    if (audit.inspector_id) {
      const inspector = inspectors.find(i => i.id === parseInt(audit.inspector_id));
      setSelectedInspector(inspector || null);
    }
  }, [audit.inspector_id, inspectors]);

  // Simulation de vérification des conflits
  useEffect(() => {
    if (audit.scheduled_date && audit.inspector_id) {
      // Simuler des conflits d'agenda
      const newConflicts = [];
      if (audit.scheduled_date === new Date().toISOString().split('T')[0]) {
        newConflicts.push("L'inspecteur a déjà 2 audits prévus ce jour");
      }
      setConflicts(newConflicts);
    } else {
      setConflicts([]);
    }
  }, [audit.scheduled_date, audit.inspector_id]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const finalAudit = {
      template_id: Number(audit.template_id),
      restaurant_id: Number(audit.restaurant_id),
      inspector_id: Number(audit.inspector_id),
      scheduled_date: `${audit.scheduled_date}T${audit.scheduled_time}:00.000Z`,
      notes: audit.notes
    };
    onSubmit(finalAudit);
    onClose();
  };

  const calculateEndTime = () => {
    if (!audit.scheduled_date || !audit.scheduled_time || !selectedTemplate) return '';
    
    const startTime = new Date(`${audit.scheduled_date}T${audit.scheduled_time}`);
    const endTime = new Date(startTime.getTime() + selectedTemplate.estimated_duration * 60000);
    return endTime.toISOString();
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const formatLastAudit = (dateString?: string) => {
    if (!dateString) return 'Aucun audit';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Planifier un Audit
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
            <span className="w-8 text-center">Template</span>
            <span className="w-12"></span>
            <span className="w-8 text-center">Restaurant</span>
            <span className="w-12"></span>
            <span className="w-8 text-center">Planning</span>
            <span className="w-12"></span>
            <span className="w-8 text-center">Notifications</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Sélectionner un template d'audit</h3>
              
              <div className="grid gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setAudit({ ...audit, template_id: template.id.toString() })}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      audit.template_id === template.id.toString()
                        ? 'border-primary bg-primary/10'
                        : 'border hover:border-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{template.name}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <FiFileText className="w-4 h-4 mr-1" />
                            {template.question_count} questions
                          </span>
                          <span className="flex items-center">
                            <FiClock className="w-4 h-4 mr-1" />
                            {template.estimated_duration} min
                          </span>
                          {template.last_used && (
                            <span>Dernière utilisation: {formatLastAudit(template.last_used)}</span>
                          )}
                        </div>
                      </div>
                      {audit.template_id === template.id.toString() && (
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

              {selectedTemplate && (
                <div className="mt-6 p-4 bg-primary/10 rounded-lg border">
                  <h4 className="font-medium text-foreground mb-2">Aperçu du template sélectionné</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Nom:</strong> {selectedTemplate.name}</p>
                    <p><strong>Catégorie:</strong> {selectedTemplate.category}</p>
                    <p><strong>Durée estimée:</strong> {selectedTemplate.estimated_duration} minutes</p>
                    <p><strong>Nombre de questions:</strong> {selectedTemplate.question_count}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Sélection Restaurant */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Restaurant à auditer</h3>
                <div className="grid gap-3">
                  {restaurants.map((restaurant) => (
                    <div
                      key={restaurant.id}
                      onClick={() => setAudit({ ...audit, restaurant_id: restaurant.id.toString() })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        audit.restaurant_id === restaurant.id.toString()
                          ? 'border-primary bg-primary/10'
                          : 'border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">{restaurant.name}</h4>
                          <p className="text-sm text-muted-foreground">{restaurant.city}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span>Dernier audit: {formatLastAudit(restaurant.last_audit)}</span>
                            {restaurant.audit_score && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                restaurant.audit_score >= 80 ? 'bg-green-100 text-green-800' :
                                restaurant.audit_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                Score: {restaurant.audit_score}%
                              </span>
                            )}
                          </div>
                        </div>
                        {audit.restaurant_id === restaurant.id.toString() && (
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

              {/* Sélection Inspecteur */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Inspecteur assigné</h3>
                <div className="grid gap-3">
                  {inspectors.map((inspector) => (
                    <div
                      key={inspector.id}
                      onClick={() => inspector.available && setAudit({ ...audit, inspector_id: inspector.id.toString() })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        !inspector.available ? 'opacity-50 cursor-not-allowed border' :
                        audit.inspector_id === inspector.id.toString()
                          ? 'border-primary bg-primary/10 cursor-pointer'
                          : 'border hover:border-muted-foreground cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FiUser className="w-8 h-8 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium text-foreground">{inspector.name}</h4>
                            <p className="text-sm text-muted-foreground">{inspector.role}</p>
                            <p className="text-sm text-muted-foreground">{inspector.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            inspector.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {inspector.available ? 'Disponible' : 'Occupé'}
                          </span>
                          {audit.inspector_id === inspector.id.toString() && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date et heure */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date prévue *
                  </label>
                  <input
                    type="date"
                    value={audit.scheduled_date}
                    onChange={(e) => setAudit({ ...audit, scheduled_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Heure prévue *
                  </label>
                  <input
                    type="time"
                    value={audit.scheduled_time}
                    onChange={(e) => setAudit({ ...audit, scheduled_time: e.target.value })}
                    className="w-full px-3 py-2 border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              {/* Conflits détectés */}
              {conflicts.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiAlertTriangle className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Conflits détectés</h4>
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {conflicts.map((conflict, index) => (
                      <li key={index}>• {conflict}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Priorité */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Priorité de l'audit
                </label>
                <div className="grid gap-3">
                  {PRIORITIES.map((priority) => (
                    <div
                      key={priority.value}
                      onClick={() => setAudit({ ...audit, priority: priority.value })}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        audit.priority === priority.value
                          ? 'border-primary bg-primary/10'
                          : 'border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`font-medium ${priority.color}`}>{priority.label}</span>
                          <p className="text-sm text-muted-foreground mt-1">{priority.description}</p>
                        </div>
                        {audit.priority === priority.value && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Récurrence */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Récurrence
                </label>
                <select
                  value={audit.recurrence}
                  onChange={(e) => setAudit({ ...audit, recurrence: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {RECURRENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={audit.notes}
                  onChange={(e) => setAudit({ ...audit, notes: e.target.value })}
                  placeholder="Instructions spéciales, contexte, points à vérifier..."
                  rows={3}
                  className="w-full px-3 py-2 border bg-background text-gray-900 placeholder:text-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              {/* Rappels automatiques */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Rappels automatiques</h3>
                <div className="space-y-3">
                  {[
                    { key: 'notify_7_days', label: '7 jours avant', desc: 'Email de préparation' },
                    { key: 'notify_24_hours', label: '24 heures avant', desc: 'Rappel email + notification' },
                    { key: 'notify_1_hour', label: '1 heure avant', desc: 'Notification mobile (si PWA)' }
                  ].map((option) => (
                    <label key={option.key} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        checked={audit.notification_settings[option.key as keyof typeof audit.notification_settings] as boolean}
                        onChange={(e) => setAudit({
                          ...audit,
                          notification_settings: {
                            ...audit.notification_settings,
                            [option.key]: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-primary bg-background border rounded focus:ring-primary"
                      />
                      <div>
                        <span className="font-medium text-foreground">{option.label}</span>
                        <p className="text-sm text-muted-foreground">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Personnes à notifier */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Personnes à notifier</h3>
                <div className="space-y-3">
                  {[
                    { key: 'notify_manager', label: 'Manager du restaurant', desc: 'Responsable sur site' },
                    { key: 'notify_team', label: 'Équipe franchiseur', desc: 'Tous les managers du tenant' },
                    { key: 'notify_regional', label: 'Responsable régional', desc: 'Direction régionale' }
                  ].map((option) => (
                    <label key={option.key} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        checked={audit.notification_settings[option.key as keyof typeof audit.notification_settings] as boolean}
                        onChange={(e) => setAudit({
                          ...audit,
                          notification_settings: {
                            ...audit.notification_settings,
                            [option.key]: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-primary bg-background border rounded focus:ring-primary"
                      />
                      <div>
                        <span className="font-medium text-foreground">{option.label}</span>
                        <p className="text-sm text-muted-foreground">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Résumé final */}
              <div className="bg-primary/10 p-4 rounded-lg border">
                <h4 className="font-medium text-foreground mb-3">📋 Résumé de l'audit</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Template:</strong> {selectedTemplate?.name}</p>
                  <p><strong>Restaurant:</strong> {selectedRestaurant?.name} ({selectedRestaurant?.city})</p>
                  <p><strong>Inspecteur:</strong> {selectedInspector?.name}</p>
                  <p><strong>Date:</strong> {new Date(`${audit.scheduled_date}T${audit.scheduled_time}`).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                  <p><strong>Durée estimée:</strong> {selectedTemplate?.estimated_duration} minutes</p>
                  <p><strong>Priorité:</strong> {PRIORITIES.find(p => p.value === audit.priority)?.label}</p>
                  {audit.recurrence !== 'none' && (
                    <p><strong>Récurrence:</strong> {RECURRENCE_OPTIONS.find(r => r.value === audit.recurrence)?.label}</p>
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
                  (step === 1 && !audit.template_id) ||
                  (step === 2 && (!audit.restaurant_id || !audit.inspector_id)) ||
                  (step === 3 && (!audit.scheduled_date || !audit.scheduled_time))
                }
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Planifier l'audit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}