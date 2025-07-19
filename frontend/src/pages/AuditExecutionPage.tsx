import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { AuditExecution, AuditResponse, AuditItem } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { 
  HiCheckCircle, 
  HiXCircle, 
  HiCamera, 
  HiSave, 
  HiCheck,
  HiArrowLeft,
  HiClock,
  HiOfficeBuilding
} from 'react-icons/hi';

export default function AuditExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [execution, setExecution] = useState<AuditExecution | null>(null);
  const [responses, setResponses] = useState<Record<number, AuditResponse>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchExecution();
    }
  }, [id]);

  const fetchExecution = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/audits/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const auditData = data.data || data;
        setExecution(auditData);
        
        // Pré-remplir les réponses existantes
        const existingResponses: Record<number, AuditResponse> = {};
        auditData.responses?.forEach((response: AuditResponse) => {
          existingResponses[response.item_id] = response;
        });
        setResponses(existingResponses);
      }
    } catch (error) {
      // Erreur lors du chargement de l'audit
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async (itemId: number, responseData: Partial<AuditResponse>) => {
    if (!execution) return;

    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/audits/${execution.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          item_id: itemId,
          ...responseData,
        }),
      });

      if (response.ok) {
        const savedResponse = await response.json();
        setResponses(prev => ({
          ...prev,
          [itemId]: savedResponse.data || savedResponse,
        }));
      }
    } catch (error) {
      // Erreur lors de l'enregistrement
    } finally {
      setSaving(false);
    }
  };

  const handleYesNoResponse = (item: AuditItem, value: boolean) => {
    submitResponse(item.id, { value: value.toString() });
  };

  const handleScoreResponse = (item: AuditItem, score: number) => {
    submitResponse(item.id, { score, value: score.toString() });
  };

  const handleTextResponse = (item: AuditItem, text: string) => {
    submitResponse(item.id, { value: text });
  };

  const completeAudit = async () => {
    if (!execution) return;

    setSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/audits/${execution.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        navigate('/audits?tab=planning');
      } else {
        const errorData = await response.json();
        // Erreur lors de la finalisation
      }
    } catch (error) {
      // Erreur lors de la finalisation
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-xl font-semibold text-foreground mb-2">Audit non trouvé</h2>
        <Button onClick={() => navigate('/audit-planning')}>
          <HiArrowLeft className="w-4 h-4 mr-2" />
          Retour au planning
        </Button>
      </div>
    );
  }

  const currentItem = execution.template.items[currentItemIndex];
  const totalItems = execution.template.items.length;
  const completedItems = Object.keys(responses).length;
  const progress = (completedItems / totalItems) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header mobile-friendly */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/audit-planning')}
            >
              <HiArrowLeft className="w-4 h-4 mr-1" />
              Retour
            </Button>
            
            <Badge variant={execution.status === 'completed' ? 'success' : 'info'}>
              {execution.status === 'completed' ? 'Terminé' : 'En cours'}
            </Badge>
          </div>
          
          <h1 className="text-lg font-semibold text-foreground">{execution.template.name}</h1>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <HiOfficeBuilding className="w-4 h-4 mr-1" />
            {execution.restaurant.name}
            <HiClock className="w-4 h-4 ml-3 mr-1" />
            {new Date(execution.scheduled_date).toLocaleDateString()}
          </div>
          
          {/* Barre de progression */}
          <div className="mt-3">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Progression</span>
              <span>{completedItems}/{totalItems}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4 max-w-2xl mx-auto">
        {currentItem ? (
          <Card className="p-6">
            <div className="mb-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-primary">
                  Question {currentItemIndex + 1}/{totalItems}
                </span>
                {responses[currentItem.id] && (
                  <HiCheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {currentItem.question}
              </h2>
              
              {currentItem.help_text && (
                <p className="text-sm text-muted-foreground mb-4">
                  {currentItem.help_text}
                </p>
              )}
            </div>

            {/* Interface de réponse selon le type */}
            <div className="space-y-4">
              {currentItem.type === 'yes_no' && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={responses[currentItem.id]?.value === 'true' ? 'primary' : 'outline'}
                    onClick={() => handleYesNoResponse(currentItem, true)}
                    className="h-16 flex flex-col items-center"
                  >
                    <HiCheckCircle className="w-6 h-6 mb-1" />
                    Oui
                  </Button>
                  <Button
                    variant={responses[currentItem.id]?.value === 'false' ? 'destructive' : 'outline'}
                    onClick={() => handleYesNoResponse(currentItem, false)}
                    className="h-16 flex flex-col items-center"
                  >
                    <HiXCircle className="w-6 h-6 mb-1" />
                    Non
                  </Button>
                </div>
              )}

              {currentItem.type === 'score' && (
                <div>
                  <div className="mb-3">
                    <label className="text-sm font-medium text-foreground">
                      Score: {responses[currentItem.id]?.score || 0}/{currentItem.max_score}
                    </label>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: (currentItem.max_score || 5) + 1 }, (_, i) => (
                      <Button
                        key={i}
                        variant={responses[currentItem.id]?.score === i ? 'primary' : 'outline'}
                        onClick={() => handleScoreResponse(currentItem, i)}
                        size="sm"
                      >
                        {i}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {currentItem.type === 'text' && (
                <div>
                  <textarea
                    className="w-full p-3 border border-border rounded-md resize-none h-32 text-gray-900 placeholder-gray-500"
                    placeholder="Entrez votre commentaire..."
                    value={responses[currentItem.id]?.value || ''}
                    onChange={(e) => handleTextResponse(currentItem, e.target.value)}
                  />
                </div>
              )}

              {currentItem.type === 'photo' && (
                <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
                  <HiCamera className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-3">Prendre une photo</p>
                  <Button>
                    <HiCamera className="w-4 h-4 mr-2" />
                    Ouvrir l'appareil photo
                  </Button>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentItemIndex(Math.max(0, currentItemIndex - 1))}
                disabled={currentItemIndex === 0}
              >
                Précédent
              </Button>

              {currentItemIndex < totalItems - 1 ? (
                <Button
                  onClick={() => setCurrentItemIndex(currentItemIndex + 1)}
                  disabled={!responses[currentItem.id]}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  onClick={completeAudit}
                  disabled={completedItems < totalItems || saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <HiSave className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <HiCheck className="w-4 h-4 mr-2" />
                  )}
                  Finaliser l'audit
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <HiCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Audit terminé !
            </h2>
            <p className="text-muted-foreground mb-4">
              Toutes les questions ont été complétées.
            </p>
            <Button onClick={() => navigate('/audit-planning')}>
              Retour au planning
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}