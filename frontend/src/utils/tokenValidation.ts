// Utilitaire pour valider et diagnostiquer les tokens JWT
export function validateJWTStructure(token: string): { isValid: boolean; error?: string } {
  if (!token || typeof token !== 'string') {
    return { isValid: false, error: 'Token vide ou non-string' };
  }

  // Supprimer les espaces en début/fin
  const cleanToken = token.trim();

  // Vérifier la structure basique (3 parties séparées par des points)
  const parts = cleanToken.split('.');
  if (parts.length !== 3) {
    return { 
      isValid: false, 
      error: `Token JWT doit avoir 3 parties séparées par des points, trouvé ${parts.length} parties` 
    };
  }

  // Vérifier que chaque partie n'est pas vide
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i] || parts[i].length === 0) {
      return { 
        isValid: false, 
        error: `Partie ${i + 1} du token JWT est vide` 
      };
    }
  }

  // Vérifier que les parties semblent être en base64
  for (let i = 0; i < parts.length; i++) {
    if (!/^[A-Za-z0-9_-]+$/.test(parts[i])) {
      return { 
        isValid: false, 
        error: `Partie ${i + 1} du token JWT contient des caractères invalides` 
      };
    }
  }

  return { isValid: true };
}

export function clearInvalidToken(): void {
  localStorage.removeItem('token');
}

export function debugToken(token: string): void {
  // Debug désactivé en production
}