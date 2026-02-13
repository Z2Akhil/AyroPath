export class CircuitBreaker {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    failureCount = 0;
    successCount = 0;
    nextAttempt = Date.now();

    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    resetTimeout: number;

    stats = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        circuitOpens: 0,
        lastFailure: null as Date | null,
        lastSuccess: null as Date | null
    };

    constructor(options: {
        failureThreshold?: number;
        successThreshold?: number;
        timeout?: number;
        resetTimeout?: number;
    } = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.successThreshold = options.successThreshold || 3;
        this.timeout = options.timeout || 60000;
        this.resetTimeout = options.resetTimeout || 300000;
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        this.stats.totalCalls++;

        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                console.log('🔴 Circuit breaker is OPEN, rejecting request');
                throw new Error('Circuit breaker is OPEN - ThyroCare API is temporarily unavailable');
            } else {
                console.log('🟡 Circuit breaker transitioning to HALF_OPEN');
                this.state = 'HALF_OPEN';
            }
        }

        try {
            console.log(`🟢 Circuit breaker ${this.state}, executing function`);
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        this.successCount++;
        this.stats.successfulCalls++;
        this.stats.lastSuccess = new Date();

        if (this.state === 'HALF_OPEN') {
            if (this.successCount >= this.successThreshold) {
                this.state = 'CLOSED';
                this.successCount = 0;
                this.stats.circuitOpens++;
            }
        }
    }

    onFailure() {
        this.failureCount++;
        this.successCount = 0;
        this.stats.failedCalls++;
        this.stats.lastFailure = new Date();

        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
            this.stats.circuitOpens++;
        }
    }

    isOpen(): boolean {
        if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) {
            this.state = 'HALF_OPEN';
            return false;
        }
        return this.state === 'OPEN';
    }
}

export const thyrocareCircuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 120000,
    resetTimeout: 300000
});
