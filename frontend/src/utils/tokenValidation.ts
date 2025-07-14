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
  console.warn('Token JWT invalide supprimé du localStorage');
}

export function debugToken(token: string): void {
  console.group('🐛 Debug Token JWT');
  console.log('Token brut:', token);
  console.log('Longueur:', token?.length);
  console.log('Type:', typeof token);
  
  if (token) {
    const parts = token.split('.');
    console.log('Nombre de parties:', parts.length);
    parts.forEach((part, index) => {
      console.log(`Partie ${index + 1}:`, part.substring(0, 50) + (part.length > 50 ? '...' : ''));
    });
  }
  
  const validation = validateJWTStructure(token);
  console.log('Validation:', validation);
  console.groupEnd();
}