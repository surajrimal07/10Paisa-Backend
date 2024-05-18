// //unused and unnecessary middleware //delete it later

// // Middleware to block requests with disallowed methods //not working
// export const allowOnly = (allowedMethods) => {
//     return (req, res, next) => {
//         console.log(allowedMethods, req.method);
//         if (!allowedMethods.includes(req.method)) {
//             res.setHeader('Content-Type', 'application/json');
//             return res.status(405).json({ error: 'Method Not Allowed', message: `${req.method} method is not allowed on this route` });
//         }
//         next();
//     };
// };

// export default allowOnly;