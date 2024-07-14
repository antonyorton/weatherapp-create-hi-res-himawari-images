const cron = require('node-cron')
const express = require('express')
const { create_himawari_image } = require('./create_hi_res_himawari_image.js')

const app = express()
const port = 3001

app.get('/', (req, res) => {
  res.send('Hello from the create-hi-res-himawari image Express app!')
})

// //render (hobby plan) app is woken up at 25 past the hour from AWS lambda
//Cron Job 1. Create Himawari image:
cron.schedule('50,52,54,56,58,0,2,4 * * * *', () => {
  const myDate = new Date()
  create_himawari_image().then(() => console.log('hi-res Himawari image created. Node-cron task completed at time: ', myDate.toISOString()))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
