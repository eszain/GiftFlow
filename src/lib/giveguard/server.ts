// GiveGuard Server Configuration
// This file contains server-side utilities for the GiveGuard verification system

import { config } from './lib/config';

export class GiveGuardServer {
  private static instance: GiveGuardServer;
  
  private constructor() {}
  
  public static getInstance(): GiveGuardServer {
    if (!GiveGuardServer.instance) {
      GiveGuardServer.instance = new GiveGuardServer();
    }
    return GiveGuardServer.instance;
  }
  
  public getConfig() {
    return config;
  }
  
  public async healthCheck(): Promise<boolean> {
    try {
      // Basic health check - in production you'd check database connections, etc.
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
  
  public async validateApiKey(apiKey: string): Promise<boolean> {
    // In production, validate against your API key store
    return apiKey === process.env.GEMINI_API_KEY;
  }
}

export const giveGuardServer = GiveGuardServer.getInstance();

