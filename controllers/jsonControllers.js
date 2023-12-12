import { promises as fsPromises } from 'fs';
import path from 'path';

const { writeFile: writeFilePromise, mkdir: mkdirPromise } = fsPromises;

export default async function saveDataToJson(data, fileName, folder) {
  try {
    const currentModuleUrl = new URL(import.meta.url);
    const currentModuleDir = path.dirname(currentModuleUrl.pathname);

    const folderPath = path.join(currentModuleDir, '..', folder);

    await mkdirPromise(folderPath, { recursive: true }).catch(() => {});

    const fullPath = path.join(folderPath, fileName);
    const jsonData = JSON.stringify(data, null, 2);

    await writeFilePromise(fullPath, jsonData);
    console.log(`Data saved to ${fullPath}`);
  } catch (error) {
    console.error(`Error saving data to ${fileName} in folder ${folder}:`, error);
  }
}
