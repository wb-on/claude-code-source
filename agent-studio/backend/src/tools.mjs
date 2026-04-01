import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve, sep } from 'path';
import { spawn } from 'child_process';

function resolveSafePath(workspaceRoot, inputPath) {
  const base = resolve(workspaceRoot);
  const target = resolve(base, inputPath);
  if (target !== base && !target.startsWith(base + sep)) {
    throw new Error(`Path خارج workspace: ${inputPath}`);
  }
  return target;
}

export async function readFileTool(args, ctx) {
  const target = resolveSafePath(ctx.workspaceRoot, args.path);
  if (!existsSync(target)) throw new Error(`File not found: ${args.path}`);
  const content = readFileSync(target, 'utf8');
  return { path: args.path, content };
}

export async function writeFileTool(args, ctx) {
  const target = resolveSafePath(ctx.workspaceRoot, args.path);
  writeFileSync(target, args.content ?? '', 'utf8');
  return { path: args.path, bytesWritten: Buffer.byteLength(args.content ?? '', 'utf8') };
}

export async function runCommandTool(args, ctx) {
  const cwd = args.cwd ? resolveSafePath(ctx.workspaceRoot, args.cwd) : ctx.workspaceRoot;
  const timeoutMs = Number(args.timeoutMs || 30_000);
  const command = String(args.command || '').trim();
  if (!command) throw new Error('command 不能为空');

  return await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      env: process.env,
    });

    let stdout = '';
    let stderr = '';
    let killedByTimeout = false;

    const timer = setTimeout(() => {
      killedByTimeout = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', chunk => (stdout += chunk.toString()));
    child.stderr.on('data', chunk => (stderr += chunk.toString()));
    child.on('error', err => {
      clearTimeout(timer);
      rejectPromise(err);
    });
    child.on('close', code => {
      clearTimeout(timer);
      resolvePromise({
        command,
        cwd,
        exitCode: killedByTimeout ? 124 : (code ?? 1),
        stdout,
        stderr: killedByTimeout ? `${stderr}\n[timeout] ${timeoutMs}ms` : stderr,
      });
    });
  });
}

export const TOOL_DEFS = [
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read a UTF-8 text file inside workspace',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Relative path inside workspace' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Write/overwrite UTF-8 content to a file inside workspace',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description: 'Run a shell command in workspace (guarded)',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string' },
          cwd: { type: 'string' },
          timeoutMs: { type: 'number' },
        },
        required: ['command'],
      },
    },
  },
];

export const TOOL_IMPL = {
  read_file: readFileTool,
  write_file: writeFileTool,
  run_command: runCommandTool,
};
