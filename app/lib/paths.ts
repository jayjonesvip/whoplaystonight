const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Prefix same-site URLs for GitHub Pages project sites. */
export function sitePath(path: string): string {
  return `${basePath}${path}`;
}
