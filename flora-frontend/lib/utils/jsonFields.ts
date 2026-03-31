/**
 * Flora API JSON Parsing Helper
 *
 * CRITICAL INFO: Several API fields in the Flora backend return raw JSON strings
 * instead of parsed JSON arrays/objects, requiring the frontend to parse them manually.
 *
 * Use this helper for fields like:
 * - suggestion.product_ids
 * - suggestion.addon_ids
 * - personalization_type.available_materials
 * - personalization_type.available_colors
 * - review.images
 * - order_item.addons
 */

/**
 * Safely parses a JSON string into an array of type T.
 * If the value is already an array, it returns it as-is.
 * If parsing fails, it returns an empty array to prevent UI crashes.
 *
 * @param value - The JSON string or actual array to parse
 * @returns Array of type T, or empty array if failed
 */
export function parseJsonArray<T>(value: string | T[] | null | undefined): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (error) {
    console.error("Failed to parse JSON string:", value, error);
    return [];
  }
}
