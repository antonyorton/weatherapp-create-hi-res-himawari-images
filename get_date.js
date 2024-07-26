//a small program to get the locale date and return a Himawari format date string
//can probably be modified and used to input an AUD date time and return the corresponding JMA time
//in Himawari format

function get_my_date() {
  const now = new Date()
  const dateLocalString = now.toString()
  const dateString = now.toLocaleDateString()
  const timeString = now.toLocaleTimeString()
  // console.log(dateString)
  // console.log(timeString)

  //get day, month, year and time
  const [day, month, year] = dateString.split('/')
  let time = timeString.split(' ')[0].replaceAll(':', '')
  // make time 24hr format
  const am_pm = timeString.split(' ')[1]
  if (am_pm == 'pm') {
    time = parseInt(time) + 120000
    time = time.toString()
  }

  // console.log('year: ', year)
  // console.log('month: ', month)
  // console.log('day: ', day)
  // console.log('time: ', time)

  //put in Himawari format
  const output = `${year}/${month}/${day}/${time}`

  return output
}

const myDate = get_my_date()
console.log('The current date and time at your locale is: ', myDate)
