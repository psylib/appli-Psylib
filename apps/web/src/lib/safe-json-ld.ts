/**
 * Sérialise un objet JSON-LD pour injection dans une balise <script> via
 * dangerouslySetInnerHTML, en neutralisant les caractères qui permettraient
 * de fermer la balise <script> ou d'injecter du HTML (XSS stocké).
 *
 * JSON.stringify n'échappe PAS `<`, `>` ni `&` — une valeur contenant
 * `</script><script>...</script>` (ex: bio/nom de psy) exécuterait du JS.
 * Le contenu d'un <script type="application/ld+json"> n'est pas exécuté comme
 * JS (donc U+2028/U+2029 ne posent pas de problème) — seul le `</script>`
 * compte ici, neutralisé en échappant `<`, `>` et `&`.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
