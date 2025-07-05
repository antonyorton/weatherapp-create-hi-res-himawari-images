//functions to create composite full disc himawari images
//based on @ungoldman/himawari (https://github.com/ungoldman/himawari)
//but updated to use sharp instead of graphicsmagick
//NOTE: successfully tested on 20 July 2024, Moment library (see ya!) removed on 26 July

const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
const axios = require('axios')
const https = require('https')

async function download_images(imsize = '4d', savedir = './tmp/') {
  console.log(
    "Allowable 'imsize' input = 4d (small), 8d (medium) or 16d (large)"
  )
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

  const example_of_correct_uri =
    'https://himawari8-dl.nict.go.jp/himawari8/img/D531106/8d/550/2024/06/27/025000_4_6.png'
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

  // const date = await getLatestDate(base_url)
  const date = await get_my_date({ hrs_to_subtract: 1 }) // new update on 20250705 due to error with fetching of ..latest.json
  console.log('Himawari latest date is: ', date)

  let uri = ''
  let tempdata
  console.log(`fetching ${tiles.length} images from ${base_url} ..`)
  return Promise.all(
    tiles.map(async tile => {
      uri = `${base_url}/${level}/${width}/${date}_${tile.x}_${tile.y}.png`
      // const uri = base_url + '/' + level + '/' + width + '/' + date + '_2_4.png'
      // console.log(uri)

      tempdata = await asyncFetchImage(uri, savedir)
      // console.log('temp_data is: ', tempdata)
      await asyncWriteImage(
        tempdata,
        `${temp_savedir}img_${level}_${tile.x}_${tile.y}.jpg`
      )
    })
  ).catch(err => {
    console.log('Error in fetching of tiles ... ', err.message)
  })
}

// var uri = url_base + '_' + tiles[0].name
// console.log('uri:', uri)

//function to fetch the first image
const asyncFetchImage = async (uri, savedir) => {
  // Need to configue different path format depending if in AWS Lambda or Local enviro

  certlocation = './fullchain.pem' //Local format
  // certlocation = '/var/task/fullchain.pem' //AWS Lambda format

  try {
    //manually provide certificate info for the site (a bit of a mess around - copilot can help)
    const caCert = await fsPromises.readFile(certlocation, 'utf8')
    // console.log('caCert: ', caCert)
    const httpsAgent = new https.Agent({
      ca: caCert,
      rejectUnauthorized: true
    })

    const image = await axios.get(uri, {
      httpsAgent,
      responseType: 'arraybuffer'
    })

    // const image = await axios.get(uri, {
    //   responseType: 'arraybuffer'
    // })

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

//function to get a recent UTC date rounding to nearest 10 min
function get_my_date({ hrs_to_subtract = 0 } = {}) {
  const now = new Date()

  // Get UTC date
  const [utcyear, utcmonth, utcday] = [
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ]
  const [utchour, utcmin, utcsec] = [
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ]
  const nowUTC = new Date(utcyear, utcmonth, utcday, utchour, utcmin, utcsec)

  let now_minused = new Date(nowUTC.valueOf())
  //subtract 'hrs_to_subtract' hours
  now_minused.setHours(now_minused.getHours() - hrs_to_subtract)
  // round minutes to nearest 10 lower
  let temp_minutes = now_minused.getMinutes()
  now_minused.setMinutes(temp_minutes - (temp_minutes % 10))
  //set seconds to zero
  now_minused.setSeconds(0)
  const dateLocalString = now.toString()
  const dateString = now_minused.toLocaleDateString()
  const timeString = now_minused.toLocaleTimeString()
  // console.log(dateString)
  console.log(timeString)
  console.log(timeString.split(' ')[0].replaceAll(':', ''))

  //get day, month, year and time
  const [day, month, year] = dateString.split('/')
  let time = timeString.split(' ')[0].replaceAll(':', '')
  // make time 24hr format
  const am_pm = timeString.split(' ')[1]
  if (am_pm == 'pm') {
    time = parseInt(time) + 120000
    time = time.toString()
  }

  ;('add a zero to the front if required so the time always has six digits')
  if (time.length < 6) {
    time = '0' + time
  }

  // console.log('year: ', year)
  // console.log('month: ', month)
  // console.log('day: ', day)
  // console.log('time: ', time)

  //put in Himawari format
  const output = `${year}/${month}/${day}/${time}`

  return output
}

module.exports = { download_images }

// download_images((imsize = '8d'))
