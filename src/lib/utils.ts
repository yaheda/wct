import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes URLs to handle common variations like:
 * - Protocol differences (http vs https)
 * - www vs non-www subdomains
 * - Trailing slashes
 * - URL encoding
 */
export function normalizeUrl(url: string): string {
  try {
    // Parse the URL
    const urlObj = new URL(url)
    
    // Normalize protocol to https (unless it's explicitly http)
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:'
    }
    
    // Remove www subdomain
    if (urlObj.hostname.startsWith('www.')) {
      urlObj.hostname = urlObj.hostname.substring(4)
    }
    
    // Remove trailing slash from pathname (except for root path)
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1)
    }
    
    // Remove default port
    if ((urlObj.protocol === 'https:' && urlObj.port === '443') ||
        (urlObj.protocol === 'http:' && urlObj.port === '80')) {
      urlObj.port = ''
    }
    
    // Sort search parameters for consistent comparison
    if (urlObj.search) {
      const params = new URLSearchParams(urlObj.search)
      const sortedParams = new URLSearchParams()
      // Sort by key
      Array.from(params.keys()).sort().forEach(key => {
        sortedParams.append(key, params.get(key)!)
      })
      urlObj.search = sortedParams.toString()
    }
    
    return urlObj.toString()
  } catch (error) {
    // If URL parsing fails, return the original URL
    console.warn(`Failed to normalize URL: ${url}`, error)
    return url
  }
}
