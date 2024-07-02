// import path from 'path';
// import putObject from './oci.js';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const testFilePath = path.resolve(__dirname, 'test.json');

// async function testPutObject() {
//     const putObjectDetails = {
//         filePath: testFilePath,
//         objectName: 'test_object.json',
//     };

//     try {
//         const response = await putObject(putObjectDetails);
//         console.log('Put Object Response:', response);
//     } catch (error) {
//         console.error('Error putting object:', error);
//     }
// }

// testPutObject();