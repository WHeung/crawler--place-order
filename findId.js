var puppeteer = require('puppeteer');
var id = 35201;
var path = require('path');


(async () => {
  var config = require(path.join(__dirname, 'config.js'))
  var arrCookie = transformCookie(config.cookie)
  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    headless: false,
    devtools: true
  })
  const page = await browser.newPage()
  await page.setCookie(...arrCookie)
  await page.goto('https://ticket.urbtix.hk/internet/zh_TW/eventDetail/' + id)
  // check(page, id).then(() => {console.log(1111111)})
})()

async function check (page, id) {
  await page.goto('https://ticket.urbtix.hk/internet/zh_TW/eventDetail/' + '/' + id)
  if (/serverRedirection/.test(page.url())) {
    throw new Error('过期,id' + id)
  }
  await page.evaluate(() => {
    if (!/黃子華/.test($('#evt-name').text())) {
      throw new Error('不是')
    }
    console.log('噢耶')
  }).catch(() => { check(page, id + 1) })
}

function transformCookie (str) {
  const arr = str.split("; ")
  const arrCookie = arr.map(item => {
    const itemArr = item.split("=")
    const name = itemArr[0]
    itemArr.shift()
    const value = itemArr.join('=')
    const resItem = {
      name: name,
      value: value,
      domain: 'ticket.urbtix.hk',
      httpOnly: true,
      secure: true
    }
    if (itemArr[0] === 'Auth_Token') {
      resItem.domain = '.urbtix.hk'
      resItem.secure = false
      resItem.expires = -1
    }
    return resItem
  })
  return arrCookie
}
// if(!/黃子華/.test($('#evt-name').text())) {
// 	var urlArr = window.location.href.split('/', -1)
// 	var id = urlArr.pop()
// 	id = Number(id) + 1
// 	var url = urlArr.join('/') + '/' + id
// 	window.location.href = url
// }
