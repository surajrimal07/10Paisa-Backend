import storage from 'node-persist';

//const defaultDirectory = path.join(process.cwd(), '.node-persist');

const defaultDirectory = '/tmp/.node-persist';

// //for localhost
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

// // // for google cloud
// export async function initializeStorage() {
//   //const storageDirectory = os.tmpdir();

//   try {
//     storage.init({ inMemoryOnly: true });
//   } catch (error) {
//     console.error(`Unable to write to directory: ${storageDirectory}`);
//     throw error;
//   }
// }

//
// export async function initializeStorage() {
//   const isCloudEnvironment = process.env.CLOUD_ENVIRONMENT === 'true';
//   let storageDirectory;

//   try {
//     storageDirectory = defaultDirectory;
//     await storage.init({
//       dir: storageDirectory,
//       forgiveParseErrors: true
//     });
//   } catch (error) {
//     if (isCloudEnvironment) {
//       storageDirectory = os.tmpdir();
//       await storage.init({
//         dir: storageDirectory,
//         forgiveParseErrors: true      });
//     } else {
//       throw new Error(`Unable to write to default directory: ${defaultDirectory}`);
//     }
//   }
// }

export default initializeStorage;