import fs from 'fs/promises';
import path from 'path';
import { PETSTORE_OUTPUT_DIR } from './constants';

export async function writePetstoreOutput(
  filename: string,
  data: unknown,
): Promise<string> {
  const outputDir = path.resolve(process.cwd(), PETSTORE_OUTPUT_DIR);
  await fs.mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, filename);
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
  return filePath;
}
