var indexUrl = 'https://ticket.urbtix.hk'
var loginUrl = 'https://ticket.urbtix.hk/internet/login/memberLogin'
var path = require('path')
var puppeteer = require('puppeteer')

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

(async () => {
  var config = require(path.join(__dirname, 'config.js'))
  console.log(config)
  var arrCookie = transformCookie(config.cookie)
  var targetUrl = `https://ticket.urbtix.hk/internet/zh_TW/secure/event/${config.evtId}/performanceDetail/${config.dateId}`
  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
    headless: false,
    // devtools: true
  })
  
  const page = await browser.newPage()
  await page.setCookie(...arrCookie)
  const pageRes = await page.goto(targetUrl)
  const chain = pageRes.request().redirectChain()
  if (chain.length) {
    console.log('\x1b[31m 有可能发生302跳转，可能登录过期')
  }
  // console.log(page.cookies('https://ticket.urbtix.hk'))
  console.log(page.url())
  await page.$$eval('#ticket-price-tbl tr', (el, config) => {
    console.log(config)
    var reg = new RegExp(config.price)
    const target = el.filter((item,index) => {return reg.test(item.innerText)})
    $(target).find('.ticket-pricezone-select-col .pricezone-radio-input').click()
  }, config)
  await page.waitForSelector('#ticket-type-tbl', { visible: true })
  await page.evaluate(() => {
    $('.ticket-quota-select').val('4')
    $('#express-purchase-btn').click()
  })
  page.waitForSelector('#popup-box-confirm-non-adj-seat', { visible: true }).then(() => {
    if (config.allowSeparateSeats) {
      page.evaluate(() => {
        $('#popup-box-confirm-non-adj-seat').next().find('button')[0].click()
      })
    } else {
      throw new Error('不能连坐');
    }
  }).catch(() => {})
  console.log('\x1b[32m', '正在检查位置，准备跳转锁票页', '\x1b[0m')
  await checkNavigate('expressPurchase', page).catch((err) => {throw new Error('去不到锁票页')})
  await page.evaluate(() => {
    $('#checkbox-not-adjacent').click()
    $('.ticket-review-confirm-btn > div.btn-outer-blk').click()
  })
  await checkNavigate('shoppingCart', page).catch((err) => {throw new Error('跳转购物篮页失败，尝试自行访问 https://ticket.urbtix.hk/internet/zh_TW/secure/shoppingCart')})
  console.log('\x1b[32m', '锁票成功', '\x1b[0m')
  const cartClick = page.$eval('#checkout-btn', el => {
    if (el) {
      el.click()
    }
  })
  const checkUrlPayment = checkNavigate('mailingPayment', page).catch((err) => {throw new Error('跳转填写资料页失败，尝试自行访问 https://ticket.urbtix.hk/internet/zh_TW/secure/mailingPayment')})
  await Promise.all([cartClick, checkUrlPayment])
  await page.evaluate((config) => {
    console.log(config)
    $('#delivery-method-select').val('TDM').change()
    $('#payment-type-select').val('323').change()
    $('#input-claim-password').val(config.takeTicketKey)
    $('#input-claim-password-retype').val(config.takeTicketKey)
    $('#input-card-number').val(config.cardNum)
    $('#button-confirm').click()
  }, config)
  await checkNavigate('transactionPreview', page).catch((err) => {throw new Error('跳转填写资料页失败，尝试自行访问 https://ticket.urbtix.hk/internet/zh_TW/secure/transactionPreview')})
  console.log('\x1b[32m', '所以操作已成功，请去打开的页面完成支付，或者自行访问 https://ticket.urbtix.hk/internet/zh_TW/secure/transactionPreview')
  await page.evaluate(() => {
    $('#checkbox-tnc').click()
    $('#button-confirm').click()
  })
})()

async function checkNavigate(key, page) {
  const reg = new RegExp(key)
  let i = 1
  while (i<5) {
    var navigator = await page.waitForNavigation({ timeout: 30000, waitUntil: 'domcontentloaded' })
    console.info(navigator._url)
    if (reg.test(navigator._url)) {
      break;
    }
    i++
  }
  if (!reg.test(navigator._url)) {
    console.log(navigator._url)
    throw new Error('出错了')
  }
  return
}

function findToken (str) {
  const arr = strCookie.split("; ")
  const tokenStr = arr.find(item => {
    const itemArr = item.split("=")
    return itemArr[0] === 'Auth_Token'
  })
  const tokenArr = tokenStr.split('=')
  const resItem = {
    name: tokenArr[0],
    value: tokenArr[1],
    domain: '.urbtix.hk',
    httpOnly: true,
    secure: false
  }
  return resItem
}
