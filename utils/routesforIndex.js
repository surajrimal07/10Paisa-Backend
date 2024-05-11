import fs from 'fs/promises';
import path from 'path';
import router from '../routes/appRoutes.js';

function generateDynamicRoutes(routes) {
  let dynamicRoutes = '';
  routes.stack.forEach((route) => {
    if (route.route && route.route.path) {
      const routePath = `/api${route.route.path}`;
      dynamicRoutes += `<div class="route" onclick="navigateToRoute('${routePath}')">
            <div class="route-method">${route.route.stack[0].method.toUpperCase()}</div>
            <div class="route-path">${routePath}</div>
        </div>`;
    }
  });
  return dynamicRoutes;
}

async function dynamicRoutes(req, res, next) {
  try {
    const __dirname = path.resolve();
    const htmlFilePath = path.join(__dirname, 'utils', 'index.html');
    const htmlData = await fs.readFile(htmlFilePath, 'utf8');

    const dynamicRoutes = generateDynamicRoutes(router);
    const dynamicHtml = htmlData.replace('id="DYNAMIC_ROUTES"', dynamicRoutes);

    res.send(dynamicHtml);
  } catch (err) {
    console.error('Error reading HTML file:', err);
    res.status(500).send('Error reading HTML file');
  }
}


export default dynamicRoutes;
