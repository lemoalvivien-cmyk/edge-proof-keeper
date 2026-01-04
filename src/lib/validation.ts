/**
 * Validation utilities for domain/scope inputs
 */

/**
 * Normalize a domain string: lowercase, trim, remove protocols
 */
export function normalizeDomain(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

/**
 * Validate a domain/scope string
 * Returns an error message if invalid, or null if valid
 */
export function validateDomain(input: string): string | null {
  if (!input || !input.trim()) {
    return "Le domaine ne peut pas être vide";
  }

  const trimmed = input.trim();
  
  // Check for only whitespace or control characters
  if (/^\s*$/.test(trimmed)) {
    return "Le domaine ne peut pas contenir uniquement des espaces";
  }

  // Reject unexpected protocols
  if (/^(ftp|file|mailto|javascript|data):/i.test(trimmed)) {
    return "Protocole non autorisé. Utilisez http:// ou https:// ou entrez le domaine directement";
  }

  // Check minimum length after normalization
  const normalized = normalizeDomain(trimmed);
  if (normalized.length < 3) {
    return "Le domaine est trop court";
  }

  // Check for valid domain format (basic check)
  const domainPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
  if (!domainPattern.test(normalized.split('/')[0])) {
    return "Format de domaine invalide";
  }

  return null;
}

/**
 * Validate a scope/description string
 */
export function validateScope(input: string): string | null {
  if (!input || !input.trim()) {
    return "Le scope ne peut pas être vide";
  }

  const trimmed = input.trim();
  
  if (trimmed.length < 5) {
    return "Le scope doit contenir au moins 5 caractères";
  }

  if (trimmed.length > 1000) {
    return "Le scope ne peut pas dépasser 1000 caractères";
  }

  return null;
}

/**
 * Sanitize text input (remove control characters, normalize whitespace)
 */
export function sanitizeTextInput(input: string): string {
  return input
    // Remove control characters except newlines
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize multiple spaces to single space
    .replace(/ +/g, ' ')
    .trim();
}
