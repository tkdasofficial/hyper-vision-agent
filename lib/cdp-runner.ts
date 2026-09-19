import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface EngineStatus {
  hasBinary: boolean;
  binaryPath: string;
  hasChromium: boolean;
  chromiumPath: string;
  architecture: string;
  version: string;
}

export interface EngineTestStep {
  step: number;
  name: string;
  status: 'pending' | 'running' | 'pass' | 'fail';
  durationMs?: number;
  detail: string;
  cdpMethod?: string;
}

export interface EngineTestResult {
  success: boolean;
  totalTimeMs: number;
  steps: EngineTestStep[];
  rawOutput: string;
  binaryUsed: boolean;
}

export interface BenchmarkResult {
  success: boolean;
  iterations: number;
  totalMs: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  throughputOpsSec: number;
  rawOutput: string;
  samples: number[];
}

export async function getEngineStatus(): Promise<EngineStatus> {
  const binaryPath = path.resolve(process.cwd(), 'build', 'hyper_vision_agent_engine');
  const hasBinary = fs.existsSync(binaryPath);

  let hasChromium = false;
  let chromiumPath = '';
  const candidates = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      hasChromium = true;
      chromiumPath = p;
      break;
    }
  }

  if (!hasChromium) {
    try {
      const { stdout } = await execAsync('which chromium || which chromium-browser || which google-chrome || true');
      if (stdout.trim()) {
        hasChromium = true;
        chromiumPath = stdout.trim();
      }
    } catch {
      // ignore
    }
  }

  return {
    hasBinary,
    binaryPath,
    hasChromium,
    chromiumPath: chromiumPath || 'Not found in system path',
    architecture: process.arch,
    version: '1.0.0-core (C++17)',
  };
}

export async function runEngineCommand(args: string[] = ['--test']): Promise<{ stdout: string; stderr: string; code: number }> {
  const binaryPath = path.resolve(process.cwd(), 'build', 'hyper_vision_agent_engine');
  if (!fs.existsSync(binaryPath)) {
    throw new Error('Hyper Vision Agent binary not found. Please build the C++ engine first.');
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(binaryPath, args, {
      cwd: process.cwd(),
      timeout: 30000,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 0 });
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

export async function triggerBuild(): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execAsync('bash build.sh', {
      cwd: process.cwd(),
      timeout: 120000,
    });
    return { success: true, output: stdout + (stderr ? '\n' + stderr : '') };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message: string };
    return {
      success: false,
      output: (error.stdout || '') + '\n' + (error.stderr || '') + '\n' + error.message,
    };
  }
}
