'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../utils/apiClient';

interface ServerInfo {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    rx: number;
    tx: number;
  };
  uptime: string;
  load: {
    '1min': number;
    '5min': number;
    '15min': number;
  };
  processes: number;
}

export default function ServerInfoPage() {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchServerInfo();
    // Refresh server info every 5 seconds
    const interval = setInterval(fetchServerInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchServerInfo = async () => {
    try {
      const response = await apiClient.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/server-info`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch server information');
      }
      
      const data = await response.json();
      setServerInfo(data.serverInfo);
    } catch (err: any) {
      setError(err.message || 'Failed to load server information');
      console.error('Error fetching server info:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatUptime = (uptimeSeconds: number): string => {
    const days = Math.floor(uptimeSeconds / (24 * 3600));
    const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fadeInSlideDown">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Server Information</h1>
          <p className="text-foreground/70">Real-time server resource monitoring</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchServerInfo}
            className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-all duration-200 text-foreground transform hover:scale-105"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/20 border border-destructive rounded-lg text-destructive animate-shake">
          {error}
        </div>
      )}

      {serverInfo && (
        <>
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeInSlideUp delay-100">
            <div className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-foreground/10 transform hover:-translate-y-1">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground/70">CPU Usage</p>
                    <p className="text-2xl font-bold mt-1 text-foreground">{serverInfo.cpu.usage.toFixed(1)}%</p>
                  </div>
                  <div className="p-2.5 bg-blue-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 w-full bg-border rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      serverInfo.cpu.usage < 50 ? 'bg-green-500' : 
                      serverInfo.cpu.usage < 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${serverInfo.cpu.usage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-foreground/10 transform hover:-translate-y-1">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground/70">Memory Usage</p>
                    <p className="text-2xl font-bold mt-1 text-foreground">{serverInfo.memory.percentage.toFixed(1)}%</p>
                  </div>
                  <div className="p-2.5 bg-purple-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 w-full bg-border rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      serverInfo.memory.percentage < 70 ? 'bg-green-500' : 
                      serverInfo.memory.percentage < 85 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${serverInfo.memory.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-foreground/70 mt-2">
                  {formatBytes(serverInfo.memory.used)} / {formatBytes(serverInfo.memory.total)}
                </p>
              </div>
            </div>
            
            <div className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-foreground/10 transform hover:-translate-y-1">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground/70">Disk Usage</p>
                    <p className="text-2xl font-bold mt-1 text-foreground">{serverInfo.disk.percentage.toFixed(1)}%</p>
                  </div>
                  <div className="p-2.5 bg-green-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 w-full bg-border rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      serverInfo.disk.percentage < 80 ? 'bg-green-500' : 
                      serverInfo.disk.percentage < 90 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${serverInfo.disk.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-foreground/70 mt-2">
                  {formatBytes(serverInfo.disk.used)} / {formatBytes(serverInfo.disk.total)}
                </p>
              </div>
            </div>
            
            <div className="bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-foreground/10 transform hover:-translate-y-1">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground/70">Uptime</p>
                    <p className="text-2xl font-bold mt-1 text-foreground">{formatUptime(parseInt(serverInfo.uptime))}</p>
                  </div>
                  <div className="p-2.5 bg-orange-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeInSlideUp delay-150">
            {/* CPU Details */}
            <div className="bg-card rounded-xl shadow-sm border border-foreground/10 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">CPU Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Model</span>
                  <span className="font-medium text-foreground">{serverInfo.cpu.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Cores</span>
                  <span className="font-medium text-foreground">{serverInfo.cpu.cores}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Usage</span>
                  <span className="font-medium text-foreground">{serverInfo.cpu.usage.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Memory Details */}
            <div className="bg-card rounded-xl shadow-sm border border-foreground/10 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Memory Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Total</span>
                  <span className="font-medium text-foreground">{formatBytes(serverInfo.memory.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Used</span>
                  <span className="font-medium text-foreground">{formatBytes(serverInfo.memory.used)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Free</span>
                  <span className="font-medium text-foreground">{formatBytes(serverInfo.memory.free)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Percentage</span>
                  <span className="font-medium text-foreground">{serverInfo.memory.percentage.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Disk Details */}
            <div className="bg-card rounded-xl shadow-sm border border-foreground/10 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Disk Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Total</span>
                  <span className="font-medium text-foreground">{formatBytes(serverInfo.disk.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Used</span>
                  <span className="font-medium text-foreground">{formatBytes(serverInfo.disk.used)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Free</span>
                  <span className="font-medium text-foreground">{formatBytes(serverInfo.disk.free)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Percentage</span>
                  <span className="font-medium text-foreground">{serverInfo.disk.percentage.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* System Load */}
            <div className="bg-card rounded-xl shadow-sm border border-foreground/10 p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">System Load</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-foreground/70">1 Minute</span>
                  <span className="font-medium text-foreground">{serverInfo.load['1min'].toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">5 Minutes</span>
                  <span className="font-medium text-foreground">{serverInfo.load['5min'].toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">15 Minutes</span>
                  <span className="font-medium text-foreground">{serverInfo.load['15min'].toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Processes</span>
                  <span className="font-medium text-foreground">{serverInfo.processes}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}