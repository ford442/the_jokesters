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
     * Format data for injection into system prompts
     */
    formatForPrompt(articles: NewsArticle[], topic: string): string {
        if (articles.length === 0) {
            return `(CONTEXT: You are discussing the topic "${topic}". Share your expert knowledge and opinions.)`;
        }

        const article = articles[0]; // Use first article for simplicity
        let context = `(BREAKING NEWS CONTEXT: You are a reporter discussing "${topic}". `;
        context += `Here's what you know: ${article.description} `;
        
        if (article.publishedAt) {
            context += `Published: ${article.publishedAt}. `;
        }
        
        context += `React as if you just learned this information. Be informative but entertaining!)`;
        
        return context;
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
}
