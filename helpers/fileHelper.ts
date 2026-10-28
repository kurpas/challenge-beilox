import fs from 'fs';
import path from 'path';

export function saveHappyPath(resource: string, body: unknown): void {
  const dir = path.resolve(__dirname, '..', 'test-data', 'happy-path');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${resource}.json`), JSON.stringify(body, null, 2) + '\n');
}