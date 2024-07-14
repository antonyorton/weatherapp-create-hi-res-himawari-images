//functions to try and create himawari images, based on @ungoldman/himawari (https://github.com/ungoldman/himawari)
//but updated to use sharp instead of graphicsmagick
//NOTE: work in progress as of 27 June 2024

const async = require('async')
const crypto = require('crypto')
const extend = require('deep-extend')
const fs = require('fs')
const gm = require('gm')
const moment = require('moment')
const path = require('path')
const request = require('request')
const mktemp = require('tmp')
const axios = require('axios')

//promisify the fs module
const fsPromises = fs.promises

const level = '8d'
const width = 550
const blocks = parseInt(level.replace(/[a-zA-Z]/g, ''), 10)

console.log('blocks:', blocks)

const now = new Date()

// Format our url paths
const time = moment(now).format('HHmmss')
const year = moment(now).format('YYYY')
const month = moment(now).format('MM')
const day = moment(now).format('DD')

console.log('time:', time)
console.log('year:', year)
console.log('month:', month)
console.log('day:', day)

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
    console.log('Image written to disk')
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
    const formatted_date = moment(date).format('YYYY/MM/DD/HHmmss')
    return formatted_date
  } catch (error) {
    console.error('Error fetching latest available datetime:', error.message)
  }
}

getLatestDate(base_url)
  .then(date => {
    uri = base_url + '/' + level + '/' + width + '/' + date + '_2_4.png'
    console.log(uri)
    return asyncFetchImage(uri)
  })
  .then(data => {
    asyncWriteImage(data, './himawari_sharp_under_construction/images/test.jpg')
  })
  .then(() => {
    console.log('Image fetch and write complete')
  })
  .catch(error => {
    console.error('Error:', error)
  })
