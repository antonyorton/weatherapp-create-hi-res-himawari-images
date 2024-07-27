//functions to create composite full disc himawari images
//based on @ungoldman/himawari (https://github.com/ungoldman/himawari)
//but updated to use sharp instead of graphicsmagick
//NOTE: successfully tested on 20 July 2024, Moment library (see ya!) removed on 26 July

const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
const axios = require('axios')

async function download_images(imsize = '4d', savedir = './tmp/') {
  console.log("Allowable 'imsize' input = 4d (small), 8d (medium) or 16d (large)")
  // const temp_savedir = './himawari_sharp_under_construction/images/'
  const temp_savedir = savedir

  // clear local directory
  // for (const file of await fsPromises.readdir(temp_savedir)) {
  //   await fsPromises.unlink(path.join(temp_savedir, file))
  // }

  const level = imsize
  console.log('imsize: ', imsize)
  const blocks = imsize.slice(0, imsize.length - 1)
  const width = 550
  console.log('blocks: ', blocks)

  const base_url = 'https://himawari8-dl.nict.go.jp/himawari8/img/D531106'
  // const url_base = [base_url, level, width, year, month, day, time].join('/')

  const example_of_correct_uri = 'https://himawari8-dl.nict.go.jp/himawari8/img/D531106/8d/550/2024/06/27/025000_4_6.png'
  console.log('example_of_correct_uri:', example_of_correct_uri)

  console.log('base_url:', base_url)

  // Compose our requests
  let tiles = []
  for (let x = 0; x < blocks; x++) {
    for (let y = 0; y < blocks; y++) {
      tiles.push({
        name: x + '_' + y + '.png',
        x: x,
        y: y
      })
    }
  }

  console.log('tiles:', tiles)

  const date = await getLatestDate(base_url)
  console.log('Himawari latest date is: ', date)

  let uri = ''
  let tempdata
  console.log(`fetching ${tiles.length} images from ${base_url} ..`)
  return Promise.all(
    tiles.map(async tile => {
      uri = `${base_url}/${level}/${width}/${date}_${tile.x}_${tile.y}.png`
      // const uri = base_url + '/' + level + '/' + width + '/' + date + '_2_4.png'
      // console.log(uri)
      tempdata = await asyncFetchImage(uri)
      await asyncWriteImage(tempdata, `${temp_savedir}img_${level}_${tile.x}_${tile.y}.jpg`)
    })
  ).catch(err => {
    console.log('Error in fetching of tiles ... ', err.message)
  })
}

// var uri = url_base + '_' + tiles[0].name
// console.log('uri:', uri)

//function to fetch the first image
const asyncFetchImage = async uri => {
  try {
    const image = await axios.get(uri, { responseType: 'arraybuffer' })
    return image.data
  } catch (error) {
    console.error('Error fetching image:', error.message)
  }
}

//function to asyncronously write the first image to disk
const asyncWriteImage = async (data, filename) => {
  try {
    await fsPromises.writeFile(filename, data, 'binary')
    // console.log('Image written to disk')
  } catch (error) {
    console.error('Error writing image to disk:', error)
  }
}

//function to get latest available datetime
const getLatestDate = async base_url => {
  const request_url = base_url + '/latest.json'
  console.log('Request URL:', request_url)
  try {
    const response = await axios.get(request_url)
    const date = response.data.date
    //convert into the form yyyy/mm/dd/hhmmss
    console.log('Himawari date: ', date)
    // To delete, old use of moment:   const formatted_date = moment(date).format('YYYY/MM/DD/HHmmss')
    //get date in format 'YYYY/MM/DD/HHmmss'
    const formattedDate1 = date.replaceAll('-', '/').split(' ')[0]
    const formattedDate2 = date.replaceAll(':', '').split(' ')[1]
    return formattedDate1 + '/' + formattedDate2
  } catch (error) {
    console.error('Error fetching latest available datetime:', error.message)
  }
}

module.exports = { download_images }

// download_images((imsize = '8d'))
