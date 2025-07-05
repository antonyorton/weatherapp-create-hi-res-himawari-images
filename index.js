// UPDATE 2025-07-05 - This function no longer works on AWS Lambda
// JMA have updated their certificates and so I needed to
// download the full chain .pem files
// and I havent yet got it running on AWS
// Note that it does, however, work locally

// PREVIOUS AWS lambda function - working (production) on 27 July 2024
//payload to handler is of the form  { image_size: '16d', local_env: false } where image_size can be '4d', '8d', '16d'
//and local_env must be false for AWS lambda environment. However, if running locally set local_env to true.
//This is due to different path format on AWS lambda machines

const { create_composite } = require('./create-composite.js')

async function handler(event) {
  try {
    await create_composite(
      (imsize = event.image_size),
      (local_env = event.local_env)
    )
    console.log('creation of himawari.jpg and push to S3 completed')
    const response = {
      statusCode: 200,
      body: JSON.stringify(`Successful fetch and push to S3 on ${new Date()}`)
    }
    return response
  } catch (err) {
    console.log(err)
  }
}

// For testing on local environment set local_env: true. In AWS lamda, it is IMPORTANT that the event has a property local_env: false
handler({ image_size: '8d', local_env: true })

module.exports = { handler }
