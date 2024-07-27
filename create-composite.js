const sharp = require('sharp')
const { download_images } = require('./himawari-sharp.js')
const { pushToS3 } = require('./push-to-s3.js')
const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')

//combine a mosaic of images with sharp library
async function combine_images(imsize = '4d', savedir = './tmp/') {
  let tiles = []

  const blocks = imsize.slice(0, imsize.length - 1)
  console.log('blocks2: ', blocks)

  for (let x = 0; x < blocks; x++) {
    for (let y = 0; y < blocks; y++) {
      tiles.push({
        name: x + '_' + y + '.png',
        x: x,
        y: y
      })
    }
  }

  const compositeArray = tiles.map(tile => {
    return { input: `${savedir}img_${imsize}_${tile.x}_${tile.y}.jpg`, top: 550 * tile.y, left: 550 * tile.x }
  })

  console.log('hello')
  const output = await sharp(`./base_image_${imsize}.jpg`, { animated: true })
    // .composite([{ input: './tmp/images/img_4d_0_0.jpg', top: 550, left: 0 }])
    .composite(compositeArray)
    .toFile(`${savedir}himawari.jpg`)
}

//download and combine images
async function create_composite(imsize = '4d', local_env = false) {
  //probably best to allow imsize = '4d' '8d' or '16d' only

  //set savePath dependent if local or not (ie local = False signifies AWS Lambda environment)
  let savePath = ''
  local_env === true ? (savePath = './tmp/') : (savePath = '/tmp/')
  console.log('savePath: ', savePath)

  //download images
  await download_images((imsize = imsize), (savedir = savePath)) //local enviromnent path format

  //then combine the mosaic and save to ./tmp/himawari.jpg
  await combine_images((imsize = imsize), (savedir = savePath))
  console.log('composite image created')

  //then push to s3 bucket 'weather-data/satellite/public-hi-res-images/himawari.jpg'
  await read_image_and_push_to_s3((bucket_dir = 'weather-data/satellite/public-hi-res-images'), (read_file = `${savePath}himawari.jpg`))

  //advise of success
  console.log('images downloaded, mosaic created and saved to S3')
}

async function read_image_and_push_to_s3(bucket_dir = 'weather-data/satellite/public-hi-res-images', read_file = './tmp/himawari.jpg') {
  const savename = `himawari.jpg`
  const objectKey = `${bucket_dir}/${savename}`
  const data = await fsPromises.readFile(read_file)
  await pushToS3(data, objectKey, 'image/jpg')
  console.log('image pushed to s3')
}

module.exports = { create_composite }

// //test main function create_composite which: [downloads individual images, creates mosaic and pushes finished product to s3]
// create_composite((imsize = '4d'))

// //test read_image_and_push_to_s3
// read_image_and_push_to_s3((bucket_dir = 'weather-data/satellite/public-hi-res-images'), (read_file = './tmp/himawari.jpg'))
