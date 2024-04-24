
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';

// Get the directory name using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


//starting https server
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, './local.decrypted.key')),
    cert: fs.readFileSync(path.join(__dirname, './local.crt'))
  };

export default httpsOptions;