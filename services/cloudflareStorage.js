/* eslint-disable no-undef */
import { S3Client } from '@ejekanshjain/cloud-storage'

const cloudflareConnection = S3Client({
    region: process.env.CLOUDFLARE_REGION,
    accessKey: process.env.CLOUDFLARE_ACCESSS_KEY,
    accessSecret: process.env.CLOUDFLARE_ACCESSS_SECRET,
    bucket: process.env.CLOUDFLARE_BUCKET_NAME,
    host: process.env.CLOUDFLARE_HOST
})


export async function addFileCloudflareStorage(filename, data) {
    await cloudflareConnection.addFile({
        filename: filename,
        data: data
    })
}

export async function getFileCloudflareStorage(filename) {
    const file = await cloudflareConnection.getFile(filename)
    if (!file) {
        return null
    }
    return await cloudflareConnection.getFile(filename)
}

export async function deleteFileCloudflareStorage(filename) {
    await cloudflareConnection.deleteFile(filename)
    return true
}


//test code

// await addFileCloudflareStorage("test.txt", "Hello, World!").then(() => {
//     console.log("File added")
// })

// await getFileCloudflareStorage("test.txt").then((data) => {
//     console.log(data.toString())
// })

// await deleteFileCloudflareStorage("test.txt").then(() => {
//     console.log("File deleted")
// })