export function formatDateTime(dateString?: string) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('fr-FR');
  } catch {
    return '-';
  }
}

export function cleanIncomingHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .trim();
}