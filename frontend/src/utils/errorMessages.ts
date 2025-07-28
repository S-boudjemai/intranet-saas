/**
 * Messages d'erreur humanisés pour FranchiseDesk
 * Transforme les erreurs techniques en messages compréhensibles
 */

interface ErrorMessage {
  title: string;
  description: string;
  action?: string;
}

export const getHumanErrorMessage = (error: any): ErrorMessage => {
  const errorMessage = error?.message || error?.error?.message || error?.toString() || 'Erreur inconnue';
  const statusCode = error?.status || error?.response?.status;

  // Erreurs réseau
  if (error?.name === 'NetworkError' || errorMessage.includes('Failed to fetch')) {
    return {
      title: 'Problème de connexion',
      description: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
      action: 'Réessayer'
    };
  }

  // Erreurs d'authentification
  if (statusCode === 401 || errorMessage.includes('Unauthorized')) {
    return {
      title: 'Session expirée',
      description: 'Votre session a expiré. Veuillez vous reconnecter.',
      action: 'Se reconnecter'
    };
  }

  if (statusCode === 403 || errorMessage.includes('Forbidden')) {
    return {
      title: 'Accès refusé',
      description: 'Vous n\'avez pas les permissions nécessaires pour cette action.',
      action: 'Contacter l\'administrateur'
    };
  }

  // Erreurs de validation
  if (statusCode === 400 || errorMessage.includes('validation')) {
    return {
      title: 'Données invalides',
      description: 'Certaines informations saisies ne sont pas valides. Vérifiez vos données.',
      action: 'Corriger'
    };
  }

  // Erreurs serveur
  if (statusCode >= 500) {
    return {
      title: 'Erreur du serveur',
      description: 'Un problème technique est survenu. Notre équipe a été notifiée.',
      action: 'Réessayer plus tard'
    };
  }

  // Erreurs spécifiques à FranchiseDesk
  if (errorMessage.includes('ticket')) {
    return {
      title: 'Erreur de ticket',
      description: 'Impossible de traiter votre demande de support. Veuillez réessayer.',
      action: 'Réessayer'
    };
  }

  if (errorMessage.includes('document')) {
    return {
      title: 'Erreur de document',
      description: 'Impossible d\'uploader ou de traiter le document. Vérifiez le format et la taille.',
      action: 'Choisir un autre fichier'
    };
  }

  if (errorMessage.includes('audit')) {
    return {
      title: 'Erreur d\'audit',
      description: 'Impossible de sauvegarder l\'audit. Vos données sont peut-être incomplètes.',
      action: 'Vérifier les informations'
    };
  }

  // Erreur de fichier trop volumineux
  if (errorMessage.includes('PayloadTooLargeError') || errorMessage.includes('File too large')) {
    return {
      title: 'Fichier trop volumineux',
      description: 'Le fichier sélectionné est trop lourd. Utilisez un fichier de moins de 10 MB.',
      action: 'Choisir un fichier plus petit'
    };
  }

  // Erreur générique mais humanisée
  return {
    title: 'Une erreur est survenue',
    description: 'Nous n\'avons pas pu traiter votre demande. Si le problème persiste, contactez le support.',
    action: 'Réessayer'
  };
};

// Messages de succès contextuels
export const getSuccessMessage = (action: string, context?: string): { title: string; description: string } => {
  switch (action) {
    case 'ticket_created':
      return {
        title: 'Ticket créé avec succès',
        description: 'Votre demande de support a été transmise. Vous recevrez une notification dès qu\'elle sera traitée.'
      };
    
    case 'ticket_archived':
      return {
        title: 'Ticket archivé',
        description: 'Le ticket a été déplacé vers les archives. Vous pouvez le retrouver dans la section Archives.'
      };
    
    case 'document_uploaded':
      return {
        title: 'Document ajouté',
        description: context ? `${context} a été uploadé avec succès.` : 'Le document a été ajouté à votre bibliothèque.'
      };
    
    case 'audit_completed':
      return {
        title: 'Audit terminé',
        description: 'L\'audit a été marqué comme terminé. Les actions correctives peuvent maintenant être planifiées.'
      };
    
    case 'user_invited':
      return {
        title: 'Invitation envoyée',
        description: 'L\'invitation a été envoyée par email. L\'utilisateur recevra ses identifiants de connexion.'
      };
    
    case 'announcement_published':
      return {
        title: 'Annonce publiée',
        description: 'Votre annonce a été publiée et tous les franchisés ont été notifiés.'
      };
    
    default:
      return {
        title: 'Action réalisée',
        description: 'L\'opération s\'est déroulée avec succès.'
      };
  }
};

// Messages d'information contextuels
export const getInfoMessage = (type: string): { title: string; description: string } => {
  switch (type) {
    case 'first_login':
      return {
        title: 'Bienvenue sur FranchiseDesk !',
        description: 'Découvrez votre espace de gestion. Commencez par consulter vos documents et créer votre premier ticket si besoin.'
      };
    
    case 'maintenance':
      return {
        title: 'Maintenance en cours',
        description: 'Certaines fonctionnalités peuvent être temporairement indisponibles. Nous nous excusons pour la gêne occasionnée.'
      };
    
    case 'new_features':
      return {
        title: 'Nouvelles fonctionnalités',
        description: 'De nouvelles fonctionnalités sont disponibles ! Consultez le guide utilisateur pour les découvrir.'
      };
    
    default:
      return {
        title: 'Information',
        description: 'Une information importante vous a été communiquée.'
      };
  }
};