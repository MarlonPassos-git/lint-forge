import { useEffect } from 'react'

const ruleDocPrefetchOrigin = 'https://biomejs.dev'

export function useRuleDocPrefetch(ruleUrls: string[]) {
  const ruleUrlKey = ruleUrls.join('\n')
  useEffect(() => {
    removeRuleDocPrefetchLinks()
    const links = [createRuleDocPreconnectLink(), ...parseRuleUrlKey(ruleUrlKey)]
    for (const link of links) document.head.append(link)
    return removeRuleDocPrefetchLinks
  }, [ruleUrlKey])
}

function parseRuleUrlKey(ruleUrlKey: string) {
  if (!ruleUrlKey) return []
  return ruleUrlKey.split('\n').map(createRuleDocPrefetchLink)
}

function removeRuleDocPrefetchLinks() {
  const selector = 'link[data-biome-rule-prefetch="true"]'
  for (const link of document.querySelectorAll(selector)) link.remove()
}

function createRuleDocPreconnectLink() {
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = ruleDocPrefetchOrigin
  link.crossOrigin = 'anonymous'
  link.dataset.biomeRulePrefetch = 'true'
  return link
}

function createRuleDocPrefetchLink(ruleUrl: string) {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.as = 'document'
  link.href = ruleUrl
  link.dataset.biomeRulePrefetch = 'true'
  return link
}
