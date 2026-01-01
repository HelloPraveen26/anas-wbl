/**
 * Renders a template string by replacing placeholders with values from metadata
 * @param template - Template string with placeholders in format {{key}}
 * @param metadata - Object containing key-value pairs for replacement
 * @returns Rendered string with placeholders replaced
 *
 * @example
 * renderTemplate("Hello {{name}}, you are {{age}} years old", { name: "John", age: "30" })
 * // Returns: "Hello John, you are 30 years old"
 */
export function renderTemplate(template: string, metadata: Record<string, any>): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
    return metadata[key] ?? match;
  });
}
