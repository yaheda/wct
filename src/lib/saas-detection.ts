export interface SaasPageType {
  type: 'pricing' | 'features' | 'blog' | 'homepage' | 'about'
  url: string
  priority: 1 | 2 | 3 // 1=high, 2=medium, 3=low
}

export interface DetectedPages {
  pages: SaasPageType[]
  confidence: number
}

export const SAAS_PAGE_PATTERNS = {
  pricing: ['/pricing', '/plans', '/billing', '/subscribe', '/price'],
  features: ['/features', '/product', '/platform', '/capabilities', '/solutions'],
  blog: ['/blog', '/changelog', '/updates', '/news', '/releases', '/announcements'],
  about: ['/about', '/company', '/story', '/team'],
  homepage: ['/', '/home', '/index']
}



export function getPagePriority(pageType: string): 1 | 2 | 3 {
  switch (pageType) {
    case 'pricing':
      return 1 // High priority
    case 'features':
      return 1 // High priority
    case 'homepage':
      return 2 // Medium priority
    case 'blog':
      return 2 // Medium priority
    case 'about':
      return 3 // Low priority
    default:
      return 2 // Default medium priority
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
            url: urlToTest,
            priority: getPagePriority(pageType)
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
      url: domain,
      priority: getPagePriority('homepage')
    })
  }

  // Calculate confidence based on how many expected SaaS pages we found
  const expectedPageTypes = ['pricing', 'features', 'homepage']
  const foundExpectedPages = foundPages.filter(p => expectedPageTypes.includes(p.type))
  const confidence = Math.round((foundExpectedPages.length / expectedPageTypes.length) * 100)

  return {
    pages: foundPages.sort((a, b) => a.priority - b.priority), // Sort by priority
    confidence
  }
}


export function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
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