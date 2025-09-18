import chalk from 'chalk';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export class DebugLogger {
  private static instance: DebugLogger;
  private debugMode: boolean = false;
  private startTime: number = Date.now();
  private logs: string[] = [];
  private timers: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    if (enabled) {
      this.log('info', '🐛 Debug mode enabled');
      this.log('info', `Platform: ${process.platform} | Node: ${process.version}`);
      this.log('info', `Working directory: ${process.cwd()}`);
      this.log('info', `Timestamp: ${new Date().toISOString()}`);
    }
  }

  isDebugMode(): boolean {
    return this.debugMode;
  }

  log(level: 'info' | 'warn' | 'error' | 'debug' | 'api', message: string, data?: any): void {
    if (!this.debugMode) return;

    const timestamp = new Date().toISOString();
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(3);

    let prefix = '';
    let color = chalk.gray;

    switch (level) {
      case 'info':
        prefix = 'ℹ️  INFO ';
        color = chalk.blue;
        break;
      case 'warn':
        prefix = '⚠️  WARN ';
        color = chalk.yellow;
        break;
      case 'error':
        prefix = '❌ ERROR';
        color = chalk.red;
        break;
      case 'debug':
        prefix = '🔍 DEBUG';
        color = chalk.gray;
        break;
      case 'api':
        prefix = '🌐 API  ';
        color = chalk.cyan;
        break;
    }

    const logMessage = `[${elapsed}s] ${prefix} ${message}`;
    console.error(color(logMessage));

    if (data) {
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      console.error(chalk.gray('  └─ ' + dataStr.replace(/\n/g, '\n     ')));
    }

    // Store for potential export
    this.logs.push(`[${timestamp}] [${elapsed}s] [${level.toUpperCase()}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`);
  }

  startTimer(label: string): void {
    if (!this.debugMode) return;
    this.timers.set(label, Date.now());
    this.log('debug', `Timer started: ${label}`);
  }

  endTimer(label: string): void {
    if (!this.debugMode) return;
    const start = this.timers.get(label);
    if (start) {
      const duration = ((Date.now() - start) / 1000).toFixed(3);
      this.log('debug', `Timer ended: ${label} (${duration}s)`);
      this.timers.delete(label);
    }
  }

  logApiRequest(method: string, url: string, headers?: any, body?: any): void {
    if (!this.debugMode) return;
    this.log('api', `${method} ${url}`);
    if (headers) {
      // Sanitize sensitive headers
      const sanitizedHeaders = { ...headers };
      if (sanitizedHeaders['Authorization']) {
        sanitizedHeaders['Authorization'] = sanitizedHeaders['Authorization'].substring(0, 20) + '...';
      }
      if (sanitizedHeaders['X-Auth-Key']) {
        sanitizedHeaders['X-Auth-Key'] = sanitizedHeaders['X-Auth-Key'].substring(0, 10) + '...';
      }
      if (sanitizedHeaders['X-Auth-Email']) {
        sanitizedHeaders['X-Auth-Email'] = sanitizedHeaders['X-Auth-Email'].replace(/(.{3}).*(@.*)/, '$1***$2');
      }
      this.log('debug', 'Request headers:', sanitizedHeaders);
    }
    if (body && method !== 'GET') {
      this.log('debug', 'Request body:', body);
    }
  }

  logApiResponse(statusCode: number, url: string, responseTime: number, body?: any): void {
    if (!this.debugMode) return;
    this.log('api', `Response ${statusCode} from ${url} (${responseTime.toFixed(0)}ms)`);
    if (body && statusCode >= 400) {
      // Log error responses
      this.log('debug', 'Error response:', body);
    } else if (body && this.debugMode) {
      // In debug mode, log first part of successful responses
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      if (bodyStr.length > 500) {
        this.log('debug', 'Response preview:', bodyStr.substring(0, 500) + '...');
      } else {
        this.log('debug', 'Response:', body);
      }
    }
  }

  logError(error: Error, context?: string): void {
    if (!this.debugMode) return;

    this.log('error', `${context ? context + ': ' : ''}${error.message}`);
    if (error.stack) {
      this.log('debug', 'Stack trace:', error.stack);
    }
    if ((error as any).response) {
      this.log('debug', 'Error response:', (error as any).response);
    }
  }

  exportDebugLog(): string {
    const debugDir = join(homedir(), '.infrasee', 'debug');
    mkdirSync(debugDir, { recursive: true });

    const filename = `debug-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    const filepath = join(debugDir, filename);

    const logContent = [
      '=== InfraSee Debug Log ===',
      `Generated: ${new Date().toISOString()}`,
      `Platform: ${process.platform}`,
      `Node Version: ${process.version}`,
      `Working Directory: ${process.cwd()}`,
      '========================',
      '',
      ...this.logs
    ].join('\n');

    writeFileSync(filepath, logContent, 'utf-8');
    return filepath;
  }

  getSummary(): string {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(3);
    const apiCalls = this.logs.filter(log => log.includes('[API]')).length / 2; // Divide by 2 for request/response pairs
    const errors = this.logs.filter(log => log.includes('[ERROR]')).length;
    const warnings = this.logs.filter(log => log.includes('[WARN]')).length;

    return `Debug Summary: Total time: ${totalTime}s | API calls: ${apiCalls} | Errors: ${errors} | Warnings: ${warnings}`;
  }
}

export const debug = DebugLogger.getInstance();