/**
 * Converts a string into an SEO-friendly slug.
 * Example: "Full Body Checkup" -> "full-body-checkup"
 * @param {string} text 
 * @returns {string}
 */
export const slugify = (text) => {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")           // Replace spaces with -
        .replace(/[^\w-]+/g, "")         // Remove all non-word chars except hyphens
        .replace(/--+/g, "-");          // Replace multiple - with single -
};
