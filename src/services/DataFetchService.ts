/**
 * DataFetchService - Fetches external data for Reporter Mode
 * Supports both News API for live topics and Wikipedia for static knowledge
 */

export interface NewsArticle {
    title: string;
    description: string;
    source: string;
    publishedAt?: string;
    url?: string;
}

export interface WikiSummary {
    title: string;
    extract: string;
    url: string;
}

export interface HackerNewsStory {
    title: string;
    url?: string;
    points: number;
    author: string;
    num_comments: number;
}

export interface EnrichedNewsContext {
    headline: string;
    summary: string;
    keyFacts: string[];
    sources: string[];
    relatedTopics: string[];
    publishDate?: string;
}

export type TopicCategory = 'science' | 'news' | 'technology' | 'sports';

export class DataFetchService {
    // Note: For production, API keys should be environment variables
    // For now, using free tier endpoints that don't require keys or fallback to Wikipedia

    /**
     * Fetch news articles on a specific topic
     * Uses NewsAPI.org free tier (limited to 100 requests/day)
     */
    async fetchNews(topic: string, category: TopicCategory = 'news'): Promise<NewsArticle[]> {
        try {
            // For demo purposes, we'll use a fallback to Wikipedia since NewsAPI requires API key
            // In production, you would use: https://newsapi.org/v2/everything?q=${topic}&apiKey=${apiKey}
            console.log(`[DataFetchService] Fetching news for topic: ${topic}, category: ${category}`);

            // Fallback to Wikipedia for now since it doesn't require API key
            const wikiData = await this.fetchWikiSummary(topic);

            return [{
                title: wikiData.title,
                description: wikiData.extract,
                source: 'Wikipedia',
                url: wikiData.url
            }];
        } catch (error) {
            console.error('[DataFetchService] Error fetching news:', error);
            return this.getFallbackNews(topic, category);
        }
    }

    /**
     * Fetch Wikipedia summary for a topic
     */
    async fetchWikiSummary(topic: string): Promise<WikiSummary> {
        try {
            const encodedTopic = encodeURIComponent(topic);
            const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTopic}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Wikipedia API returned ${response.status}`);
            }

            const data = await response.json();

            return {
                title: data.title || topic,
                extract: data.extract || 'No summary available.',
                url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTopic}`
            };
        } catch (error) {
            console.error('[DataFetchService] Error fetching Wikipedia summary:', error);
            return this.getFallbackWikiSummary(topic);
        }
    }

    /**
     * Get curated topic suggestions based on category
     */
    getTopicSuggestions(category: TopicCategory): string[] {
        const suggestions: Record<TopicCategory, string[]> = {
            science: ['Quantum Computing', 'Mars Rover', 'CRISPR', 'Black Holes', 'Climate Change'],
            news: ['Artificial Intelligence', 'Space Exploration', 'Renewable Energy', 'Robotics'],
            technology: ['Neural Networks', 'Blockchain', 'Virtual Reality', '5G Networks', 'Quantum Computers'],
            sports: ['Olympics', 'World Cup', 'NBA Finals', 'Formula 1', 'Tour de France']
        };

        return suggestions[category] || suggestions.news;
    }

    /**
     * Fallback news when API fails
     */
    private getFallbackNews(topic: string, category: TopicCategory): NewsArticle[] {
        return [{
            title: `Breaking: ${topic}`,
            description: `Recent developments in ${topic} have caught the attention of experts worldwide. The ${category} community is closely monitoring the situation.`,
            source: 'Fallback News Service'
        }];
    }

    /**
     * Fallback Wikipedia summary when API fails
     */
    private getFallbackWikiSummary(topic: string): WikiSummary {
        return {
            title: topic,
            extract: `${topic} is a fascinating subject that continues to evolve. Experts and enthusiasts discuss various aspects of this topic regularly.`,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`
        };
    }

    /**
     * Fetch Hacker News stories related to a topic
     */
    async fetchHackerNews(topic: string, limit: number = 3): Promise<NewsArticle[]> {
        try {
            // Use HN Algolia API for search
            const encodedTopic = encodeURIComponent(topic);
            const url = `https://hn.algolia.com/api/v1/search?query=${encodedTopic}&tags=story&hitsPerPage=${limit}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HN API returned ${response.status}`);
            }

            const data = await response.json();
            const hits: any[] = data.hits || [];

            return hits.map((hit: any) => ({
                title: hit.title || 'Untitled',
                description: `Discussion by ${hit.author} with ${hit.num_comments || 0} comments. ${hit.points || 0} points.`,
                source: 'Hacker News',
                publishedAt: hit.created_at ? new Date(hit.created_at).toISOString() : undefined,
                url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`
            }));
        } catch (error) {
            console.error('[DataFetchService] Error fetching HN:', error);
            return [];
        }
    }

    /**
     * Fetch from multiple sources and aggregate
     */
    async fetchAggregatedNews(topic: string, category: TopicCategory = 'news'): Promise<EnrichedNewsContext> {
        // Fetch from multiple sources in parallel
        const [wikiResult, hnResult] = await Promise.allSettled([
            this.fetchWikiSummary(topic),
            this.fetchHackerNews(topic, 2)
        ]);

        const articles: NewsArticle[] = [];
        let wikiSummary: WikiSummary | null = null;

        // Process Wikipedia result
        if (wikiResult.status === 'fulfilled') {
            wikiSummary = wikiResult.value;
            articles.push({
                title: wikiSummary.title,
                description: wikiSummary.extract,
                source: 'Wikipedia',
                url: wikiSummary.url
            });
        }

        // Process HN results
        if (hnResult.status === 'fulfilled' && hnResult.value.length > 0) {
            articles.push(...hnResult.value);
        }

        // Build enriched context
        const keyFacts = this.extractKeyFacts(wikiSummary?.extract || '');
        const relatedTopics = this.generateRelatedTopics(topic, category);

        return {
            headline: articles[0]?.title || topic,
            summary: articles[0]?.description || `${topic} is a trending topic with significant interest.`,
            keyFacts,
            sources: Array.from(new Set(articles.map(a => a.source))),
            relatedTopics,
            publishDate: new Date().toISOString()
        };
    }

    /**
     * Extract key facts from text (simple extraction)
     */
    private extractKeyFacts(text: string): string[] {
        // Split by sentences and pick the most informative ones
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        return sentences.slice(0, 3).map(s => s.trim());
    }

    /**
     * Generate related topics based on category
     */
    private generateRelatedTopics(_topic: string, category: TopicCategory): string[] {
        const related: Record<TopicCategory, string[]> = {
            science: ['Research', 'Discovery', 'Innovation', 'Experiment'],
            news: ['Breaking', 'Analysis', 'Impact', 'Reactions'],
            technology: ['AI', 'Software', 'Hardware', 'Future Tech'],
            sports: ['Championship', 'Records', 'Teams', 'Highlights']
        };
        return related[category] || related.news;
    }

    /**
     * Format data for injection into system prompts (enhanced version)
     */
    formatForPrompt(articles: NewsArticle[], topic: string): string {
        if (articles.length === 0) {
            return this.formatBasicContext(topic);
        }

        const mainArticle = articles[0];
        const otherArticles = articles.slice(1);
        const date = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        let context = `📰 NEWS BRIEFING - ${date}

TOPIC: "${topic}"
HEADLINE: ${mainArticle.title}
SOURCE: ${mainArticle.source}

KEY INFORMATION:
${mainArticle.description}

`;

        if (otherArticles.length > 0) {
            context += `ADDITIONAL PERSPECTIVES:\n`;
            otherArticles.forEach((article, idx) => {
                context += `${idx + 1}. [${article.source}] ${article.title}\n`;
            });
            context += `\n`;
        }

        context += `YOUR ROLE: You are a panelist on a news comedy show discussing this topic.
TONE: Be informative but entertaining. Balance facts with wit.
RULES:
- Base opinions on the provided information
- Feel free to speculate humorously on implications
- React to other panelists' takes
- Stay conversational and engaging`;

        return `(CONTEXT: ${context})`;
    }

    /**
     * Format enriched context for prompts
     */
    formatEnrichedContext(context: EnrichedNewsContext): string {
        const date = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        });

        let prompt = `📰 NEWS BRIEFING - ${date}

`;
        prompt += `HEADLINE: ${context.headline}\n\n`;
        
        if (context.keyFacts.length > 0) {
            prompt += `KEY FACTS:\n`;
            context.keyFacts.forEach((fact, idx) => {
                prompt += `${idx + 1}. ${fact}\n`;
            });
            prompt += `\n`;
        }

        prompt += `SOURCES: ${context.sources.join(', ')}\n\n`;

        if (context.relatedTopics.length > 0) {
            prompt += `RELATED: ${context.relatedTopics.join(', ')}\n\n`;
        }

        prompt += `YOUR ROLE: Panelist on a news comedy show. Be witty, informed, and entertaining.`;

        return `(CONTEXT: ${prompt})`;
    }

    /**
     * Format basic context when no data is available
     */
    private formatBasicContext(topic: string): string {
        return `(CONTEXT: You are discussing "${topic}" on a news comedy panel show. 
The topic is trending and relevant to today's audience.
TONE: Informative but entertaining. Balance facts with humor.
APPROACH: Share informed opinions, ask provocative questions, and engage in witty banter with other panelists.)`;
    }

    /**
     * Format Wikipedia data for injection
     */
    formatWikiForPrompt(summary: WikiSummary): string {
        let context = `(KNOWLEDGE BASE: You are discussing "${summary.title}". `;
        context += `Here's what you know: ${summary.extract} `;
        context += `Share insights and engage in discussion about this topic!)`;

        return context;
    }

    /**
     * Format custom pasted article text for prompt injection
     */
    formatCustomArticle(text: string, title: string = 'Article'): string {
        const truncated = text.length > 1800 ? text.substring(0, 1800) + '...' : text;
        return `(CUSTOM ARTICLE CONTEXT: Title: "${title}". Content: ${truncated} \\
Discuss the key facts, share humorous takes, debate implications, and improvise around the topic!)`;
    }
}
