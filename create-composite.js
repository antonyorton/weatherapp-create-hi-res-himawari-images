const sharp = require('sharp')
const { download_images } = require('./himawari-sharp.js')

//combine a mosaic of images with sharp library
async function combine_images(imsize = '4d') {
  let tiles = []

  const blocks = imsize.slice(0, imsize.length - 1)
  console.log('blocks: ', blocks)

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
    return { input: `./tmp/images/img_${imsize}_${tile.x}_${tile.y}.jpg`, top: 550 * tile.y, left: 550 * tile.x }
  })

  console.log('hello')
  const output = await sharp(`./tmp/base_image_${imsize}.jpg`, { animated: true })
    // .composite([{ input: './tmp/images/img_4d_0_0.jpg', top: 550, left: 0 }])
    .composite(compositeArray)
    .toFile('./tmp/combined.png')
}

//download and combine images
async function create_composite(imsize = '4d') {
  //probably best to allow imsize = '4d' '8d' or '16d' only
  await download_images((imsize = imsize), (savedir = './tmp/images/')) //first download
  console.log('images downloaded')
  await combine_images((imsize = imsize)) //then combine the mosaic
  console.log('composite image created')
}

create_composite((imsize = '4d'))
