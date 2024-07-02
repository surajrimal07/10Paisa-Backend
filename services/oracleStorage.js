/* eslint-disable no-undef */
import { S3Client } from '@ejekanshjain/cloud-storage'

const oracleConnection = S3Client({
    region: process.env.ORACLE_REGION,
    accessKey: process.env.ORACLE_ACCESS_KEY,
    accessSecret: process.env.ORACLE_SECRET_KEY,
    bucket: process.env.ORACLE_BUCKET_NAME,
    host: process.env.ORACLE_HOST
})

export async function addFileOracleStorage(filename, data) {
    await oracleConnection.addFile({
        filename: filename,
        data: data
    })
}

export async function getFileOracleStorage(filename) {
    const file = await oracleConnection.getFile(filename)
    if (!file) {
        return null
    }
    return await oracleConnection.getFile(filename)
}

export async function deleteFileOracleStorage(filename) {
    await oracleConnection.deleteFile(filename)
    return true
}


// //test code

// await addFileOracleStorage("testfilenodejs.txt", "Hello, World!").then(() => {
//     console.log("File added")
// })

// await getFileOracleStorage("testfilenodejs.txt").then((data) => {
//     console.log(data.toString())
// })

// // await deleteFileOracleStorage("test.txt").then(() => {
// //     console.log("File deleted")
// // })