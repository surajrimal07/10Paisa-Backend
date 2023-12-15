import { promises as fsPromises } from 'fs';
import path from 'path';

const { writeFile: writeFilePromise, mkdir: mkdirPromise } = fsPromises;

export default async function saveDataToJson(data, fileName, folder) {
    try {
      const fullPath = path.join(folder, fileName);
      await mkdirPromise(folder, { recursive: true }).catch(() => {});

      const jsonData = JSON.stringify(data, null, 2);
      await writeFilePromise(fullPath, jsonData);

      console.log(`Today Data saved to ${fullPath}`);
  } catch (error) {
    console.error(`Error saving data to ${fileName} in folder ${folder}:`, error);
  }
}
