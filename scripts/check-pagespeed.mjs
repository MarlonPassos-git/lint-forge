const pageSpeedEndpoint = 'https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed'
const productionUrl = process.env.PAGESPEED_URL ?? 'https://lint-forge.marlonpassos.com.br/'
const apiKey = readRequiredEnvironment('PAGESPEED_API_KEY')
const analysisCount = readAnalysisCount(process.env.PAGESPEED_RUNS ?? '3')
const strategies = ['desktop', 'mobile']
const categoryGates = [
  { id: 'performance', requestName: 'PERFORMANCE', threshold: 90 },
  { id: 'accessibility', requestName: 'ACCESSIBILITY', threshold: 100 },
  { id: 'best-practices', requestName: 'BEST_PRACTICES', threshold: 100 },
  { id: 'seo', requestName: 'SEO', threshold: 100 },
  { id: 'agentic-browsing', requestName: 'AGENTIC_BROWSING', threshold: 100 },
]

for (const strategy of strategies) {
  const analyses = await collectStrategyAnalyses(strategy)
  const medianScores = calculateMedianScores(analyses)
  printStrategyResult(strategy, analyses, medianScores)
  assertPageSpeedThresholds(strategy, medianScores)
}

function readRequiredEnvironment(environmentName) {
  const environmentValue = process.env[environmentName]?.trim()
  if (environmentValue) return environmentValue
  throw new Error(`Invalid ${environmentName}: <empty>; expected a non-empty CI secret`)
}

function readAnalysisCount(rawCount) {
  const analysisTotal = Number(rawCount)
  if (Number.isInteger(analysisTotal) && analysisTotal > 0 && analysisTotal <= 5) {
    return analysisTotal
  }
  throw new Error(`Invalid PAGESPEED_RUNS: ${rawCount}; expected an integer from 1 through 5`)
}

async function collectStrategyAnalyses(strategy) {
  const analyses = []
  for (let analysisIndex = 0; analysisIndex < analysisCount; analysisIndex += 1) {
    console.log(`${strategy}: running PageSpeed analysis ${analysisIndex + 1}/${analysisCount}`)
    analyses.push(await requestPageSpeedAnalysis(strategy))
  }
  return analyses
}

async function requestPageSpeedAnalysis(strategy) {
  const requestUrl = buildPageSpeedUrl(strategy)
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetchPageSpeedResponse(requestUrl, strategy, attempt)
    if (!response) continue
    if (response.ok) return parsePageSpeedAnalysis(response, strategy)
    if (!isRetryableStatus(response.status) || attempt === 3) {
      throw new Error(`PageSpeed ${strategy} returned HTTP ${response.status}; expected 200`)
    }
    await waitForRetry(response, attempt)
  }
  throw new Error(`Invalid PageSpeed retry state: ${strategy}; expected a completed request`)
}

function buildPageSpeedUrl(strategy) {
  const requestUrl = new URL(pageSpeedEndpoint)
  requestUrl.searchParams.set('url', productionUrl)
  requestUrl.searchParams.set('strategy', strategy)
  requestUrl.searchParams.set('key', apiKey)
  for (const gate of categoryGates) requestUrl.searchParams.append('category', gate.requestName)
  return requestUrl
}

async function fetchPageSpeedResponse(requestUrl, strategy, attempt) {
  try {
    return await fetch(requestUrl, { signal: AbortSignal.timeout(120_000) })
  } catch {
    if (attempt < 3) {
      await wait(2 ** (attempt - 1) * 1_000)
      return null
    }
    throw new Error(`PageSpeed ${strategy} request failed after ${attempt} attempts; expected JSON`)
  }
}

async function parsePageSpeedAnalysis(response, strategy) {
  let responseBody
  try {
    responseBody = await response.json()
  } catch {
    throw new Error(
      `Invalid PageSpeed ${strategy} response: non-JSON body; expected Lighthouse JSON`,
    )
  }
  assertValidLighthouseResult(responseBody, strategy)
  return {
    fetchTime: responseBody.lighthouseResult.fetchTime,
    scores: readCategoryScores(responseBody.lighthouseResult.categories, strategy),
  }
}

function assertValidLighthouseResult(responseBody, strategy) {
  const runtimeCode = responseBody?.lighthouseResult?.runtimeError?.code
  if (runtimeCode) {
    throw new Error(
      `Invalid PageSpeed ${strategy} runtime: ${runtimeCode}; expected no runtime error`,
    )
  }
  if (responseBody?.lighthouseResult?.categories) return
  throw new Error(
    `Invalid PageSpeed ${strategy} response: missing categories; expected Lighthouse result`,
  )
}

function readCategoryScores(categories, strategy) {
  const scores = {}
  for (const gate of categoryGates) {
    const categoryScore = categories[gate.id]?.score
    if (typeof categoryScore !== 'number' || categoryScore < 0 || categoryScore > 1) {
      throw new Error(
        `Invalid ${strategy} ${gate.id} score: ${String(categoryScore)}; expected number from 0 to 1`,
      )
    }
    scores[gate.id] = categoryScore * 100
  }
  return scores
}

function calculateMedianScores(analyses) {
  return Object.fromEntries(
    categoryGates.map((gate) => [
      gate.id,
      calculateMedian(analyses.map((analysis) => analysis.scores[gate.id])),
    ]),
  )
}

function calculateMedian(values) {
  const sortedValues = [...values].sort((left, right) => left - right)
  const middleIndex = Math.floor(sortedValues.length / 2)
  if (sortedValues.length % 2 === 1) return sortedValues[middleIndex]
  return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
}

function printStrategyResult(strategy, analyses, medianScores) {
  const fetchTimes = analyses.map((analysis) => analysis.fetchTime).join(', ')
  const scores = categoryGates
    .map((gate) => `${gate.id}=${medianScores[gate.id].toFixed(1)}`)
    .join(' ')
  console.log(`${strategy}: median ${scores}`)
  console.log(`${strategy}: Lighthouse fetch times ${fetchTimes}`)
}

function assertPageSpeedThresholds(strategy, medianScores) {
  const failures = categoryGates.filter((gate) => medianScores[gate.id] < gate.threshold)
  if (failures.length === 0) return
  const summary = failures
    .map((gate) => `${gate.id}=${medianScores[gate.id].toFixed(1)} expected>=${gate.threshold}`)
    .join(', ')
  throw new Error(`PageSpeed ${strategy} gate failed: ${summary}`)
}

function isRetryableStatus(statusCode) {
  return statusCode === 429 || statusCode >= 500
}

async function waitForRetry(response, attempt) {
  const retryAfterHeader = response.headers.get('retry-after')
  const retryAfterSeconds = retryAfterHeader === null ? Number.NaN : Number(retryAfterHeader)
  const fallbackDelay = 2 ** (attempt - 1) * 1_000
  const retryDelay = Number.isFinite(retryAfterSeconds)
    ? Math.min(retryAfterSeconds * 1_000, 30_000)
    : fallbackDelay
  await wait(retryDelay)
}

function wait(delayMilliseconds) {
  return new Promise((resolve) => setTimeout(resolve, delayMilliseconds))
}
