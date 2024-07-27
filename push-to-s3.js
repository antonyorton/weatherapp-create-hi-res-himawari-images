const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
require('dotenv').config()

// create an S3 client
const s3Client = new S3Client({
  region: process.env.MY_AWS_REGION,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY
  }
})

//function to push image to S3 bucket  [file type 'image/jpg']
async function pushToS3(data, objectKey, type) {
  try {
    // create a PutObjectCommand to upload data to S3 bucket
    const command = new PutObjectCommand({
      Bucket: process.env.MY_AWS_BUCKET_NAME,
      Key: objectKey,
      Body: data,
      ContentType: type
    })

    // execute the command
    const response = await s3Client.send(command)
    // console.log('Data pushed to S3 successfully:', data[data.length - 1])
  } catch (error) {
    console.error('Error pushing data to S3:', error)
  }
}

module.exports = { pushToS3 }
