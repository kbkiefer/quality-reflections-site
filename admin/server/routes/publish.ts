import { Router, Request, Response } from 'express';
import { exec } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireAuth } from '../auth.js';
import { exportData } from '../export.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..', '..');

const router = Router();

let publishState = {
  status: 'idle' as 'idle' | 'exporting' | 'building' | 'deploying' | 'live' | 'error',
  lastPublish: null as string | null,
  error: null as string | null,
};

router.get('/status', requireAuth, (_req: Request, res: Response) => {
  res.json(publishState);
});

router.post('/', requireAuth, async (_req: Request, res: Response) => {
  if (publishState.status !== 'idle' && publishState.status !== 'live' && publishState.status !== 'error') {
    res.status(409).json({ error: 'Publish already in progress' });
    return;
  }

  res.json({ message: 'Publish started' });

  try {
    publishState = { ...publishState, status: 'exporting', error: null };
    exportData();

    publishState = { ...publishState, status: 'building' };
    await runCommand('npm run build', PROJECT_ROOT);

    publishState = { ...publishState, status: 'deploying' };
    await runCommand('bash deploy.sh', PROJECT_ROOT);

    const now = new Date().toISOString();
    publishState = { status: 'live', lastPublish: now, error: null };
    setTimeout(() => {
      if (publishState.status === 'live') publishState = { ...publishState, status: 'idle' };
    }, 10000);
  } catch (err: any) {
    publishState = { ...publishState, status: 'error', error: err.message };
  }
});

function runCommand(cmd: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, timeout: 300000 }, (error, stdout, stderr) => {
      if (error) { reject(new Error(`${cmd} failed: ${stderr || error.message}`)); return; }
      resolve(stdout);
    });
  });
}

export default router;
