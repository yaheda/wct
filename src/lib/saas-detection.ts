export interface SaasPageType {
  type: 'pricing' | 'features' | 'blog' | 'homepage' | 'about' | 'custom'
  url: string
  label?: string // Custom label for the page
  isCustom?: boolean // Whether this was manually added
}

export interface DetectedPages {
  pages: SaasPageType[]
  confidence: number
}

export interface CustomPageInput {
  url: string
  type: 'pricing' | 'features' | 'blog' | 'homepage' | 'about' | 'custom'
  label?: string
}

export const SAAS_PAGE_PATTERNS = {
  pricing: ['/pricing', '/plans', '/billing', '/subscribe', '/price'],
  features: ['/features', '/product', '/platform', '/capabilities', '/solutions'],
  blog: ['/blog', '/changelog', '/updates', '/news', '/releases', '/announcements'],
  about: ['/about', '/company', '/story', '/team'],
  homepage: ['/', '/home', '/index']
}




export function validateCustomPageUrl(url: string, domain: string): { isValid: boolean; error?: string } {
  if (!url.trim()) {
    return { isValid: false, error: 'URL is required' }
  }

  try {
    // Handle both full URLs and relative paths
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Full URL validation
      const urlObj = new URL(url)
      // Normalize URL domain by removing www. prefix
      const urlDomain = urlObj.hostname.replace(/^www\./, '')
      const cleanDomain = extractDomainFromUrl(domain)
      
      if (urlDomain !== cleanDomain) {
        return { isValid: false, error: 'URL must be from the same domain' }
      }
    } else {
      // Relative path validation
      if (!url.startsWith('/')) {
        return { isValid: false, error: 'Relative URLs must start with /' }
      }
      
      // Basic path validation
      if (url.includes('..') || url.includes('<') || url.includes('>')) {
        return { isValid: false, error: 'Invalid characters in URL path' }
      }
    }
    
    return { isValid: true }
  } catch {
    return { isValid: false, error: 'Invalid URL format' }
  }
}

export function normalizeCustomPageUrl(url: string, domain: string): string {
  // If it's already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // If it's a relative path, combine with domain
  const cleanDomain = domain.startsWith('http') ? domain : `https://${domain}`
  return `${cleanDomain.replace(/\/$/, '')}${url.startsWith('/') ? url : '/' + url}`
}

export function createCustomPage(input: CustomPageInput, domain: string): SaasPageType {
  const normalizedUrl = normalizeCustomPageUrl(input.url, domain)
  
  return {
    type: input.type,
    url: normalizedUrl,
    label: input.label,
    isCustom: true
  }
}

export async function testUrl(url: string): Promise<{ status: number; exists: boolean }> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD'
    })
    return { 
      status: response.status, 
      exists: response.status >= 200 && response.status < 400 
    }
  } catch {
    return { 
      status: 0, 
      exists: false 
    }
  }
}

export async function detectSaasPages(domain: string): Promise<DetectedPages> {
  if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
    domain = `https://${domain}`
  }

  const foundPages: SaasPageType[] = []
  const allPatterns = Object.entries(SAAS_PAGE_PATTERNS)
  
  for (const [pageType, patterns] of allPatterns) {
    for (const pattern of patterns) {
      const urlToTest = domain.endsWith('/') ? 
        `${domain.slice(0, -1)}${pattern}` : 
        `${domain}${pattern}`
      
      try {
        const result = await testUrl(urlToTest)
        
        if (result.exists) {
          foundPages.push({
            type: pageType as SaasPageType['type'],
            url: urlToTest
          })
          break // Found one for this page type, move to next type
        }
      } catch {
        console.warn(`Failed to test URL ${urlToTest}`)
        continue
      }
    }
  }

  // Ensure homepage is always included if no specific homepage was found
  if (!foundPages.some(p => p.type === 'homepage')) {
    foundPages.push({
      type: 'homepage',
      url: domain
    })
  }

  // Calculate confidence based on how many expected SaaS pages we found
  const expectedPageTypes = ['pricing', 'features', 'homepage']
  const foundExpectedPages = foundPages.filter(p => expectedPageTypes.includes(p.type))
  const confidence = Math.round((foundExpectedPages.length / expectedPageTypes.length) * 100)

  return {
    pages: foundPages, // Return pages in detection order
    confidence
  }
}


export function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    // Normalize by removing www. prefix
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    // Fallback: extract domain and normalize
    const domain = url.replace(/^https?:\/\//, '').split('/')[0]
    return domain.replace(/^www\./, '')
  }
}

export function validateSaasDomain(domain: string): { isValid: boolean; error?: string } {
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0]
    
    if (!cleanDomain || cleanDomain.length < 3) {
      return { isValid: false, error: 'Domain too short' }
    }
    
    if (!cleanDomain.includes('.')) {
      return { isValid: false, error: 'Invalid domain format' }
    }
    
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!domainRegex.test(cleanDomain)) {
      return { isValid: false, error: 'Invalid domain format' }
    }
    
    return { isValid: true }
  } catch {
    return { isValid: false, error: 'Invalid domain format' }
  }
}