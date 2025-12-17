// Simple in-memory cache for email messages
class MessageCache {
  private cache: Map<string, { messages: any[], timestamp: number }> = new Map();
  private ttl: number; // Time to live in milliseconds

  constructor(ttl: number = 5 * 60 * 1000) { // 5 minutes default
    this.ttl = ttl;
  }

  // Get cached messages for a user
  get(username: string): any[] | null {
    const entry = this.cache.get(username);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(username);
      return null;
    }
    
    return entry.messages;
  }

  // Set cached messages for a user
  set(username: string, messages: any[]): void {
    this.cache.set(username, {
      messages,
      timestamp: Date.now()
    });
  }

  // Invalidate cache for a user
  invalidate(username: string): void {
    this.cache.delete(username);
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  stats(): { size: number, ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.ttl
    };
  }
}

// Create singleton instances for POP3 and IMAP
export const pop3Cache = new MessageCache();
export const imapCache = new MessageCache();

// Periodically clean up expired entries
setInterval(() => {
  pop3Cache.cleanup();
  imapCache.cleanup();
}, 60 * 1000); // Clean up every minute