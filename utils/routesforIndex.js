import fs from 'fs/promises';
import path from 'path';
import router from '../routes/appRoutes.js'; //main routes

// Function to generate dynamic routes HTML
function generateDynamicRoutes(routes) {
  //console.log(routes.stack); // Check router stack contents

  let dynamicRoutes = '';
  routes.stack.forEach((route) => {
    if (route.route && route.route.path) {
        const routePath = `/api${route.route.path}`; // Add /api/ to the route path
        dynamicRoutes += `<div class="route" onclick="navigateToRoute('${routePath}')">
            <div class="route-method">${route.route.stack[0].method.toUpperCase()}</div>
            <div class="route-path">${routePath}</div>
        </div>`;
    }
});
return dynamicRoutes;
}

// Middleware to inject dynamic routes into HTML
async function dynamicRoutes(req, res, next) {
  try {
    const __dirname = path.resolve();
    const htmlFilePath = path.join(__dirname, 'utils', 'index.html');
    const htmlData = await fs.readFile(htmlFilePath, 'utf8');

    // Generate dynamic routes HTML using the existing router instance
    const dynamicRoutes = generateDynamicRoutes(router);
    const dynamicHtml = htmlData.replace('id="DYNAMIC_ROUTES"', dynamicRoutes);

    console.log('Dynamic HTML:', dynamicHtml);
    res.send(dynamicHtml);
  } catch (err) {
    console.error('Error reading HTML file:', err);
    res.status(500).send('Error reading HTML file');
  }
}


export default dynamicRoutes;
