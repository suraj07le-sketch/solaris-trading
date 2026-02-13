
/**
 * Simple client-side rate limiter queue.
 * Ensures we don't hammer the API with concurrent requests.
 */
class RateLimiter {
    private queue: Array<() => Promise<any>> = [];
    private processing = false;
    private delayMs: number;

    constructor(delayMs = 800) {
        this.delayMs = delayMs;
    }

    /**
     * Add a request to the queue.
     * @param info - string to identify the request type (e.g. "quote", "history")
     * @param fn - Async function to execute
     */
    add<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await fn();
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            });
            this.process();
        });
    }

    private async process() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;

        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                await task();
                // Wait for the delay or at least some time before next request to respect rate limits
                await new Promise(res => setTimeout(res, this.delayMs));
            }
        }

        this.processing = false;
    }
}

// Singleton instance tailored for the Indian Stock API which is sensitive
export const indianApiLimiter = new RateLimiter(1200); // 1.2s delay between requests to be safe
