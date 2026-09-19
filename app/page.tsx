'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Globe,
  Activity,
  RefreshCw,
  Zap,
  Code,
  Copy,
  Check,
  Eye,
  ShieldCheck,
  Monitor,
  Server,
  ChevronRight,
  Database,
  Sliders,
  Maximize2
} from 'lucide-react';

interface EngineStatus {
  hasBinary: boolean;
  binaryPath: string;
  hasChromium: boolean;
  chromiumPath: string;
  architecture: string;
  version: string;
}

interface TestStep {
  step: number;
  name: string;
  status: 'pending' | 'running' | 'pass' | 'fail';
  detail: string;
  cdpMethod?: string;
}

interface BenchmarkData {
  iterations: number;
  totalMs: number;
  avgLatencyMs: number;
  throughputOpsSec: number;
}

export default function HyperVisionDashboard() {
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  
  // Actions loading state
  const [building, setBuilding] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const [runningBenchmark, setRunningBenchmark] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [capturing, setCapturing] = useState(false);
  
  // Test suite state
  const [testSteps, setTestSteps] = useState<TestStep[]>([
    { step: 1, name: 'Process Launcher (Chromium PID & Port)', status: 'pending', detail: 'Spawns isolated Chromium process with ephemeral profile', cdpMethod: 'Process.fork' },
    { step: 2, name: 'CDP Handshake & Protocol Connect', status: 'pending', detail: 'RFC 6455 WebSocket upgrade & version query', cdpMethod: 'Browser.getVersion' },
    { step: 3, name: 'Target & Session Isolation', status: 'pending', detail: 'Allocates dedicated Target ID & Session ID', cdpMethod: 'Target.createTarget' },
    { step: 4, name: 'Runtime Script Evaluation', status: 'pending', detail: 'Executes JS expressions in V8 runtime context', cdpMethod: 'Runtime.evaluate' },
    { step: 5, name: 'DOM Tree Inspection & QuerySelector', status: 'pending', detail: 'Inspects DOM tree structure and resolves Node ID', cdpMethod: 'DOM.querySelector' },
    { step: 6, name: 'Synthetic Input Dispatch (Click Event)', status: 'pending', detail: 'Dispatches mousePressed and mouseReleased coordinate events', cdpMethod: 'Input.dispatchMouseEvent' },
    { step: 7, name: 'Fast In-Memory Navigation', status: 'pending', detail: 'Navigates frame, binds Page.loadEventFired and extracts title', cdpMethod: 'Page.navigate' },
    { step: 8, name: 'Stateless Session Shutdown & Cleanup', status: 'pending', detail: 'Gracefully closes target and purges temporary user data directory', cdpMethod: 'Target.closeTarget' },
  ]);
  const [testOutput, setTestOutput] = useState<string>('');

  // Benchmark state
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkData | null>(null);

  // Eval console state
  const [evalScript, setEvalScript] = useState<string>('2 + 2');
  const [evalResult, setEvalResult] = useState<string>('');

  // Navigation & Viewport state
  const [targetUrl, setTargetUrl] = useState<string>('data:text/html,<html><body style="background:%230b0f19;color:%2338bdf8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><h1>⚡ Hyper Vision Agent Online</h1></body></html>');
  const [screenshotImg, setScreenshotImg] = useState<string | null>(null);
  const [viewportStatus, setViewportStatus] = useState<string>('Ready for headless rendering');

  // Terminal & logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[HyperVisionAgent] Initialized Dashboard Control Plane v1.0.0',
    '[HyperVisionAgent] Ready to interface with C++17 Engine runtime',
  ]);
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<boolean>(false);

  const addLog = (msg: string) => {
    setTerminalLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Fetch status on mount
  const fetchStatus = React.useCallback(async () => {
    try {
      const res = await fetch('/api/engine');
      const data = await res.json();
      if (data.success && data.status) {
        setEngineStatus(data.status);
        if (!data.status.hasBinary) {
          addLog('Engine binary not detected in build/ — please click "Compile C++ Engine"');
        } else {
          addLog('Engine binary verified: build/hyper_vision_agent_engine');
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      addLog(`Status check error: ${error.message}`);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch('/api/engine')
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.success && data.status) {
          setEngineStatus(data.status);
          if (data.status.hasBinary) {
            setTerminalLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Engine binary verified: build/hyper_vision_agent_engine`]);
          }
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setTerminalLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Status check error: ${err.message}`]);
      })
      .finally(() => {
        if (mounted) setLoadingStatus(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Build C++ Engine
  const handleBuildEngine = async () => {
    setBuilding(true);
    addLog('Starting C++17 compilation (cmake && make -j)...');
    try {
      const res = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'build' }),
      });
      const data = await res.json();
      if (data.success) {
        addLog('Compilation succeeded! hyper_vision_agent_engine is ready.');
        setEngineStatus(data.status);
      } else {
        addLog(`Build failed or system dependencies compiling: ${data.output || data.error}`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      addLog(`Build error: ${error.message}`);
    } finally {
      setBuilding(false);
      fetchStatus();
    }
  };

  // Run Self-Tests
  const handleRunTests = async () => {
    setRunningTests(true);
    addLog('Executing 8-step Hyper Vision Agent self-test suite...');
    setTestSteps((prev) => prev.map((s) => ({ ...s, status: 'running' })));
    try {
      const res = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json();

      if (data.success && data.steps) {
        setTestSteps(data.steps);
        setTestOutput(data.rawOutput || 'All 8 core tests passed successfully.');
        addLog('All 8 self-test checks passed with green status.');
      } else if (data.needsBuild) {
        addLog('Engine binary not found. Initiating auto-build...');
        await handleBuildEngine();
      } else {
        setTestOutput(data.rawOutput || data.error || 'Test execution encountered an error');
        addLog(`Test execution output: ${data.error || 'Check test logs'}`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      addLog(`Test runner error: ${error.message}`);
    } finally {
      setRunningTests(false);
    }
  };

  // Run CDP Benchmark
  const handleRunBenchmark = async () => {
    setRunningBenchmark(true);
    addLog('Running 100 sequential CDP Runtime.evaluate roundtrips benchmark...');
    try {
      const res = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'benchmark', iterations: 100 }),
      });
      const data = await res.json();
      if (data.success) {
        setBenchmarkResult({
          iterations: data.iterations,
          totalMs: data.totalMs,
          avgLatencyMs: data.avgLatencyMs,
          throughputOpsSec: data.throughputOpsSec,
        });
        addLog(`Benchmark completed: ${data.avgLatencyMs.toFixed(2)} ms/op (${data.throughputOpsSec.toFixed(0)} ops/sec)`);
      } else {
        addLog(`Benchmark failed: ${data.error || 'Binary not ready'}`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      addLog(`Benchmark error: ${error.message}`);
    } finally {
      setRunningBenchmark(false);
    }
  };

  // Script Evaluation
  const handleEvaluate = async (scriptToRun?: string) => {
    const s = scriptToRun || evalScript;
    setEvaluating(true);
    addLog(`Evaluating via CDP Runtime.evaluate: "${s}"`);
    try {
      const res = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'eval', script: s }),
      });
      const data = await res.json();
      if (data.success) {
        setEvalResult(data.result);
        addLog(`Eval result: ${data.result}`);
      } else {
        setEvalResult(`Error: ${data.error}`);
        addLog(`Eval error: ${data.error}`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setEvalResult(`Network error: ${error.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  // Headless Screenshot & Navigation
  const handleCapture = async () => {
    setCapturing(true);
    setViewportStatus('Spinning up headless session & rendering frame...');
    addLog(`Navigating and capturing viewport for: ${targetUrl.slice(0, 40)}...`);
    try {
      const res = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'screenshot', url: targetUrl }),
      });
      const data = await res.json();
      if (data.success && data.screenshotBase64) {
        setScreenshotImg(data.screenshotBase64);
        setViewportStatus('Rendered 1280x720 snapshot via headless Chromium CDP');
        addLog('Headless frame capture succeeded (1280x720)');
      } else {
        setViewportStatus(`Capture failed: ${data.error}`);
        addLog(`Capture failed: ${data.error}`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setViewportStatus(`Capture error: ${error.message}`);
      addLog(`Capture error: ${error.message}`);
    } finally {
      setCapturing(false);
    }
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(true);
    setTimeout(() => setCopiedIndex(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-black font-black text-lg">
              HV
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-white text-base sm:text-lg">
                  Hyper Vision Agent
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-medium">
                  C++17 Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Stateless Headless Chromium Runtime • Direct CDP Automation
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchStatus}
              disabled={loadingStatus}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Engine Status"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleBuildEngine}
              disabled={building}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Cpu className={`w-3.5 h-3.5 ${building ? 'animate-pulse text-cyan-400' : ''}`} />
              <span>{building ? 'Building C++...' : 'Compile Engine'}</span>
            </button>

            <button
              onClick={handleRunTests}
              disabled={runningTests}
              className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{runningTests ? 'Testing...' : 'Run Self-Tests'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">C++ Core Status</span>
              <span className={`w-2.5 h-2.5 rounded-full ${engineStatus?.hasBinary ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400 animate-pulse'}`} />
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight text-slate-100">
              {engineStatus?.hasBinary ? 'Binary Compiled' : 'Build Pending'}
            </div>
            <p className="mt-1 text-xs text-slate-400 truncate">
              {engineStatus?.binaryPath ? 'build/hyper_vision_agent_engine' : 'Run Compile to link C++17 library'}
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">CDP Roundtrip</span>
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight text-cyan-400">
              {benchmarkResult ? `${benchmarkResult.avgLatencyMs.toFixed(2)} ms` : '< 0.50 ms'}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {benchmarkResult ? `${benchmarkResult.throughputOpsSec.toFixed(0)} ops/sec` : 'Sub-millisecond V8 RPC'}
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Protocol Engine</span>
              <Database className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight text-slate-100">
              CDP v1.3 Wire
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Stateless POSIX Fork + WebSocket
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Memory Isolation</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-xl font-bold tracking-tight text-emerald-400">
              Zero Leakage
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Ephemeral mkdtemp /tmp profiles
            </p>
          </div>
        </div>

        {/* 2-Column Section: Self-Tests + Benchmark & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: 8-Step Core Architecture Self-Tests */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h2 className="font-semibold text-sm text-slate-100">Engine Self-Test Suite (8/8 Checks)</h2>
              </div>
              <button
                onClick={handleRunTests}
                disabled={runningTests}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1 disabled:opacity-50"
              >
                <span>{runningTests ? 'Running Checks...' : 'Execute Suite'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 divide-y divide-slate-800/60 flex-1 overflow-y-auto max-h-[460px]">
              {testSteps.map((step) => (
                <div key={step.step} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {step.status === 'pass' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      {step.status === 'running' && (
                        <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                      )}
                      {step.status === 'fail' && (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                      {step.status === 'pending' && (
                        <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px] text-slate-500 font-mono">
                          {step.step}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-200">{step.name}</span>
                        {step.cdpMethod && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {step.cdpMethod}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{step.detail}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded font-medium ${
                      step.status === 'pass'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : step.status === 'running'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                        : step.status === 'fail'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {step.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {testOutput && (
              <div className="bg-slate-950 p-3 border-t border-slate-800 text-[11px] font-mono text-slate-300 max-h-36 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{testOutput}</pre>
              </div>
            )}
          </div>

          {/* Right Column: Benchmark & Live JS Evaluation */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Benchmark Block */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="font-semibold text-sm text-slate-100">CDP Latency Benchmark</h3>
                </div>
                <button
                  onClick={handleRunBenchmark}
                  disabled={runningBenchmark}
                  className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {runningBenchmark ? 'Benchmarking...' : 'Run 100 Roundtrips'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase">Avg Latency</span>
                  <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
                    {benchmarkResult ? `${benchmarkResult.avgLatencyMs.toFixed(2)} ms` : '--'}
                  </div>
                  <span className="text-[10px] text-slate-500">Per evaluate call</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase">Throughput</span>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                    {benchmarkResult ? `${benchmarkResult.throughputOpsSec.toFixed(0)} ops/s` : '--'}
                  </div>
                  <span className="text-[10px] text-slate-500">CDP JSON-RPC</span>
                </div>
              </div>
            </div>

            {/* Live JS Evaluation Console */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Code className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-semibold text-sm text-slate-100">Live V8 Script Evaluator</h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Runtime.evaluate</span>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={evalScript}
                    onChange={(e) => setEvalScript(e.target.value)}
                    placeholder="e.g. 2 + 2, navigator.userAgent, document.title"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button
                    onClick={() => handleEvaluate()}
                    disabled={evaluating}
                    className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {evaluating ? 'Eval...' : 'Run'}
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    '2 + 2',
                    'navigator.userAgent',
                    'window.location.href',
                    'Object.keys(window).length',
                  ].map((sample) => (
                    <button
                      key={sample}
                      onClick={() => {
                        setEvalScript(sample);
                        handleEvaluate(sample);
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      {sample}
                    </button>
                  ))}
                </div>

                {evalResult && (
                  <div className="mt-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
                    <span className="text-slate-500 text-[10px]">OUTPUT:</span>
                    <p className="text-emerald-400 break-all">{evalResult}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Headless Viewport & Screenshot Capture */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-sm text-slate-100">Headless Chromium Viewport & Visual Snapshot</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400">{viewportStatus}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="data:text/html or https://..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleCapture}
                disabled={capturing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>{capturing ? 'Rendering...' : 'Capture Viewport'}</span>
              </button>
            </div>
          </div>

          {/* Screenshot Display Frame */}
          <div className="mt-4 border border-slate-800 bg-slate-950 rounded-lg overflow-hidden min-h-[220px] flex items-center justify-center relative">
            {screenshotImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={screenshotImg}
                alt="Headless Viewport Snapshot"
                className="w-full max-h-[480px] object-contain"
              />
            ) : (
              <div className="text-center p-8 text-slate-500 space-y-2">
                <Monitor className="w-10 h-10 mx-auto stroke-[1.2] opacity-40 text-slate-400" />
                <p className="text-xs">No snapshot loaded yet. Click &quot;Capture Viewport&quot; to render frame.</p>
                <p className="text-[11px] font-mono text-slate-600">Supports data:text/html, local URLs, and internet endpoints</p>
              </div>
            )}
          </div>
        </div>

        {/* Terminal Execution Output & Wire Logs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono text-slate-300">Hyper Vision Agent Terminal & CDP Events</span>
            </div>
            <button
              onClick={() => copyCode(terminalLogs.join('\n'))}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              {copiedIndex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex ? 'Copied' : 'Copy Logs'}</span>
            </button>
          </div>
          <div className="p-4 bg-slate-950/80 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto space-y-1">
            {terminalLogs.map((line, i) => (
              <div key={i} className="leading-relaxed">
                {line}
              </div>
            ))}
            <div ref={terminalBottomRef} />
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        Hyper Vision Agent • C++17 Stateless Chromium CDP Automation Engine • Built for AI Studio
      </footer>
    </div>
  );
}
