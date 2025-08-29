// utils/markdownUtils.ts

/**
 * Renders basic markdown (bold, italics) to HTML.
 * WARNING: This is a very basic parser. For a real application, 
 * use a robust, security-vetted library like 'marked' or 'DOMPurify' 
 * to prevent XSS vulnerabilities when rendering user-generated HTML.
 * 
 * Supported syntax:
 * - *italic* or _italic_
 * - **bold** or __bold__
 */
export const renderMarkdown = (text: string): string => {
  if (!text) return '';

  let html = text;

  // Escape HTML to prevent basic XSS if not using a sanitizer later
  // For this controlled environment, we'll assume content is mostly safe,
  // but in a real app, sanitize BEFORE markdown conversion or use a lib that does both.
  // html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");


  // Bold: **text** or __text__
  // Non-greedy match for content inside delimiters
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italics: *text* or _text_
  // Make sure not to conflict with bold, so process after or use more specific regex
  // This regex tries to avoid matching parts of bold, e.g. * in **bold**
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '<em>$1</em>');
  
  // Basic line breaks (convert single newlines to <br>)
  // Note: For more complex paragraph handling, a proper markdown lib is better.
  html = html.replace(/\n/g, '<br />');

  return html;
};