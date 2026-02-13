export class RequestQueue {
    private queue: any[] = [];
    private processing = false;
    private concurrency: number;
    private minDelay: number;
    private lastProcessed = 0;

    stats = {
        totalProcessed: 0,
        totalFailed: 0,
        queueSize: 0,
        averageWaitTime: 0,
        lastProcessedTime: null as Date | null
    };

    constructor(options: { concurrency?: number; minDelay?: number } = {}) {
        this.concurrency = options.concurrency || 1;
        this.minDelay = options.minDelay || 5000;
    }

    async enqueue<T>(fn: () => Promise<T>, options: any = {}): Promise<T> {
        return new Promise((resolve, reject) => {
            const request = {
                fn,
                resolve,
                reject,
                enqueuedAt: Date.now(),
                priority: options.priority || 'normal',
                metadata: options.metadata || {}
            };

            if (request.priority === 'high') {
                this.queue.unshift(request);
            } else {
                this.queue.push(request);
            }

            this.stats.queueSize = this.queue.length;
            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    private async processQueue() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;
        while (this.queue.length > 0) {
            const request = this.queue.shift();
            this.stats.queueSize = this.queue.length;

            try {
                const now = Date.now();
                const timeSinceLastProcessed = now - this.lastProcessed;
                const delayNeeded = Math.max(0, this.minDelay - timeSinceLastProcessed);

                if (delayNeeded > 0) {
                    await new Promise(resolve => setTimeout(resolve, delayNeeded));
                }

                const waitTime = Date.now() - request.enqueuedAt;
                this.stats.averageWaitTime = (this.stats.averageWaitTime * this.stats.totalProcessed + waitTime) / (this.stats.totalProcessed + 1);

                const result = await request.fn();
                this.stats.totalProcessed++;
                this.stats.lastProcessedTime = new Date();
                this.lastProcessed = Date.now();
                request.resolve(result);
            } catch (error: any) {
                this.stats.totalFailed++;
                request.reject(error);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.processing = false;
    }
}

export const thyrocareRequestQueue = new RequestQueue({
    concurrency: 1,
    minDelay: 10000
});
