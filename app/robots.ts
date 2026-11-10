import type { MetadataRoute } from 'next';

const PRIVATE_PATHS = ['/admin', '/api', '/aces-demo'];

/**
 * Crawler policy (owner decision, Nov 2026):
 * - Search engines and AI *search* crawlers are allowed on public pages
 *   (Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot, PerplexityBot, etc.),
 *   through the default rule below.
 * - Crawlers or tokens whose documented purpose is AI model training are blocked:
 *   GPTBot (OpenAI training), ClaudeBot (Anthropic training), and Google-Extended
 *   (Gemini training/grounding token; per Google it does not affect Search or
 *   AI Overviews).
 * - User-initiated fetchers (ChatGPT-User, Claude-User, Perplexity-User) are not
 *   named; their operators say robots.txt may not apply to them.
 * Sources: developers.openai.com/api/docs/bots, support.claude.com/en/articles/8896518,
 * docs.perplexity.ai/docs/resources/perplexity-crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
      { userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended'], disallow: '/' },
    ],
    sitemap: 'https://listworx.co/sitemap.xml',
  };
}
