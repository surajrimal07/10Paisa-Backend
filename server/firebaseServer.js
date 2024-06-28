import admin from 'firebase-admin';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const parentDir = path.resolve(__dirname, '..');

// const filePath = path.join(parentDir, 'certificate/firebase.json');

// const serviceAccount = fs.readFileSync(filePath);

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: "tenpaisa-467a7",
        clientEmail: "firebase-adminsdk-pm149@tenpaisa-467a7.iam.gserviceaccount.com",
        privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCnwMHYtl3DehRY\nGrPnfxiOTJevhSRLFEToI2uV7YyBFGO+ANy2bku4ByMAupyplu2kh/uzLkK7ivcd\nkgun4YLaj0SZQfjYo2fx0nXgCLJQ68qGi6GM4dYOSb48/XEJzVLlBnIxxHl0UvAn\ncn8RDVZHnUdRth7APet5txTeMYnXIimaxWJHPjgJHcuH4xEOogEV+/CEerzXGoLq\nxZJn8w4tkLv/fK6Abo8FlTkSDFluANo+xnpVGjCEvDvjnbiSfBQkG+sPlpcWGcoJ\nP/FHV5e+2Ql/DzoCDCFIvHkilGAopmkonD4xvD8ou7Dv9ro4UPyVRznRCDmzM2TA\n+z4BJgd7AgMBAAECggEAJvvWkIQg2hJ+s9LQyBVzIW6POYzZWFFHiiLhF6ByrHSO\nkVMl94c+NXADJGI5kfevFjM7vPIdM/QhZU/RQZxYim4M5Qi9yap/t2TPW9bpiYCi\nOg4s5s58rilY+ldzc3Gxt+N9mi8sgmnbwW8MNGxDBrV4I3cNQmOhW1G+mbwtaj73\nyzfNw6Ji/8IiwioAYn9iv4QDvzh5aqGF4rzr3mWNA/tmrCuwfgUF45zqyQiwOwxG\n1rYv4aJu6ZUXoXyCPEqHikTOb5DMyHx6MjKOTmR8oe/aiQWnqetLiIokF87QKvhf\nzaLcJPI4QW1EPfWmddnt75BI0++Q/Jv0kJqGUS0oAQKBgQDVtiGCz4u+E6Q7Jaqc\nAL/MoRhKURfnBk88x9mtjXOuPTaAZ5jO9cJBhIbyGaWZdmIlHLZ59P924gSgH/Ta\nhMlUptkR6vuqaC79EojAqZJAjrcrjeMNG+THNioS8EVcuER7B6PmCiK6js4MSDT0\nR//VGOqv2VEbr4hgAp7McBkuAQKBgQDI8of0Hk4D/csC6iiL+SUvMnKSNgEqJOx6\nz6uKB44kk9zcXHKaftkEGwuulNWId/bjnCU0UWh5W6Yj8MW/87t90fjpI4rQ0njk\nURnzYdm6uS8jWSY/QvTd9UvTHoavXUdKtlK2fVpL05/kAR1xKbI2a67uArw+ye4q\n0r+zoXbtewKBgQC5xMAMfWzzpQ81euB7CwuuTLpYn3UvlQR7yR0nB7Zu1zbxFxx1\nipt5aEIFYNXaOFXH/NWB3b3TEVUD+8NTz+lSdFZshN6OmlF+GwZUsxI2m9gNPCEJ\n3B1aLXMVU1Z36pVcfJ+z70uQ72Gcu4eMcKmqCya2BSnD7ymUi7KN80NwAQKBgATK\nEwd0eXOK5v3IyvKbG5HGaAioFNsGSkSbEoGVsIOaqpbt9SVNhKqeYmbk0ToRceb2\n38QhdJX/4zPUF0J98qgLCx2zZSmY+pymejHc0S2sID19cHXtiJyJrib4AUnItVxI\ngCwtTKul/ZeXlzYNQlwdsOunUQlGEtEeeMc1P/plAoGBAI6dRfyKE44zMB8ZJogt\nQ2fe9wh8s0KSlF0p2pc9HySEr3i/6Q//QIJ7hwdQSBOvFcrkU2wBqq9fGBBNCUnP\n1Psluvz4Ek4+HUNhV7lpCBi5kFaiTon8Ey9zCObu47YTLJjuzpMeqS7uXHKR+x7R\nYH3fZcxxLPOkKeMb3dPib2os\n-----END PRIVATE KEY-----\n"
    })

});

export default admin;
