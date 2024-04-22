import storage from 'node-persist';

const defaultDirectory = '/tmp/.node-persist';
export async function initializeStorage() {

  try {
    await storage.init({
      dir: defaultDirectory,
      forgiveParseErrors: true,
    });
  } catch (error) {
    console.error(`Unable to write to directory: ${defaultDirectory}`);
    throw error;
  }
}

export default initializeStorage;