
import { get_NepseTopData } from './nepse_server/singletonNepseServer.js';


// console.log(await is_NepseOpen());

// console.log(await get_NepseSummary());

// console.log(await get_NepseIndex());

//console.log(await get_NepseTopGainer('top-turnover'));

//console.log(await get_NepsePriceVolume());

//console.log(await get_NepseSubIndices());

//console.log(await get_ItemDailyIndexGraph("NEPSE"));

//console.log(await get_NepseSecurityList());

console.log(await get_NepseTopData());

// console.log(new Date().toISOString().split('T')[0]);

// //do this in node js today date -timedelta(days=365)
// console.log(new Date(new Date().setDate(new Date().getDate() - 365)).toISOString().slice(0, 10));



// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';


// async function loadCssWasm(wasmPath) {
//     try {
//         const buffer = fs.readFileSync(wasmPath); // Read the WebAssembly file as a buffer
//         const module = await WebAssembly.compile(buffer); // Compile the WebAssembly module
//         const instance = await WebAssembly.instantiate(module); // Instantiate the module
//         return instance; // Return the instantiated WebAssembly module
//     } catch (error) {
//         console.error('Error loading css.wasm:', error);
//         throw error; // Re-throw the error for handling in the calling code
//     }
// }

// (async () => {
//     const __filename = fileURLToPath(import.meta.url);
//     const basePath = path.dirname(__filename); // Get the directory of the current script
//     const wasmPath = path.join(basePath, 'css.wasm'); // Construct the full path to the WebAssembly file

//     try {
//         const cssWasmInstance = await loadCssWasm(wasmPath);
//         // Use the imported functions from cssWasmInstance here (if any)
//         console.log(await cssWasmInstance);
//         console.log('Successfully loaded css.wasm');
//     } catch (error) {
//         console.error('Error loading css.wasm:', error);
//     }
// })();



// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// const data = await fetch("https://www.nepalstock.com/api/authenticate/prove", {
//     "credentials": "omit",
//     "headers": {
//         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
//         "Accept": "application/json, text/plain, */*",
//         "Accept-Language": "en-US,en;q=0.5",
//         "Sec-Fetch-Dest": "empty",
//         "Sec-Fetch-Mode": "cors",
//         "Sec-Fetch-Site": "same-origin",
//         "Sec-GPC": "1"
//     },
//     "referrer": "https://www.nepalstock.com/",
//     "method": "GET",
//     "mode": "cors"
// });


// console.log(await data.json());