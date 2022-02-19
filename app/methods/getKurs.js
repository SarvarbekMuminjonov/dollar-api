import request from "request"
import cheerio from "cheerio"
// import bot from "../core/bot.js"
// import config from "../config/index.js"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
// import cron from "node-cron"
const __dirname = path.dirname(fileURLToPath(import.meta.url))
function getLatinRegion(cryllic) {
  switch (cryllic) {
    case "Джизак":
      return "Jizzax"
    case "Наманган":
      return "Namangan"
    case "Коканд":
      return "Qo'qon"
    case "Самарканд":
      return "Samarqand"
    case "Фергана":
      return "Farg'ona"
    case "Маргилан":
      return "Marg'ilon"
    case "Андижан":
      return "Andijon"
    case "Бухара":
      return "Buxoro"
    case "Ташкент":
      return "Toshkent"
    default:
      logToAdmin("Yangi shahar nomi: " + cryllic)
      return cryllic
  }
}
const getUSDBazarAndInBanks = () => {
  return new Promise((resolve, reject) => {
    request("https://dollaruz.pw/", (err, res, body) => {
      if (!err && res.statusCode === 200) {
        try {
          const $ = cheerio.load(body)
          let list_usd = []
          $('div[class="ari-data-tables jui-smoothness"] tbody tr').each(
            (i, e) => {
              let tds = $(e).children("td")
              let region = getLatinRegion(tds.eq(0).text())
              let buy = parseInt(tds.eq(1).text().replace(" ", ""))
              let sell = parseInt(tds.eq(2).text().replace(" ", ""))
              let time = tds.eq(3).text()
              list_usd[i] = [sell, buy, time, region]
            }
          )
          let bazar = {
            usd: { data: list_usd, fields: ["sell", "buy", "time", "name"] },
          }

          list_usd = []
          $("div.banks table tbody tr").each((i, e) => {
            let tds = $(e).children("td")
            let name = tds.eq(0).text()
            let buy = parseInt(tds.eq(1).text().replace(" ", ""))
            let sell = parseInt(tds.eq(2).text().replace(" ", ""))
            list_usd.push([sell, buy, name])
          })
          let bank = {
            usd: { data: list_usd, fields: ["sell", "buy", "name"] },
          }
          resolve({ bazar, bank })
        } catch (error) {
          console.log("Error getUSDBazarAndInBanks t/c" + error)
        }
      } else {
        console.log("Error getUSDBazarAndInBanks status", err)
        reject(undefined)
      }
    })
  })
}

const getRubBazar = () => {
  return new Promise((resolve, reject) => {
    request("https://dollaruz.net/", (err, res, body) => {
      if (!err && res.statusCode === 200) {
        const $ = cheerio.load(body)
        try {
          let list_rub = []
          $('table[id="droptablesTbl47"] tr').each((i, e) => {
            if (i == 1) {
              let tds = $(e).children("td")
              let buy = parseInt(tds.eq(0).text().replace(" ", ""))
              let sell = parseInt(tds.eq(1).text().replace(" ", ""))
              list_rub.push([sell, buy])
            }
          })
          resolve(list_rub)
        } catch (error) {
          console.log("Error getRubBazar " + error)
          reject({ err: "err" })
        }
      } else {
        console.log("Error getRubBazar2 " + err)
        reject({ err: "getRubBazar2" })
      }
    })
  })
}
function getBanks() {
  return new Promise((resolve, reject) => {
    request("https://dollaruz.net/", async (err, res, body) => {
      if (!err && res.statusCode === 200) {
        try {
          let banksArray = []
          const $ = cheerio.load(body)
          $('table[id="droptablesTbl45"] tbody tr').each((i, e) => {
            let tds = $(e).children("td")
            let name = tds.eq(0).text().replace(" ", "")
            let buy = tds.eq(1).text().replace(" ", "")
            let sell = tds.eq(2).text().replace(" ", "")
            banksArray.push({ name, buy, sell })
          })
          console.log(banksArray)
          let sorted = banksArray
            .filter((a) => {
              if (a.buy > 9000) return a
            })
            .sort((a, b) => a.buy - b.buy)
          // console.log(sorted)
          return sorted
        } catch (error) {
          console.log("Error getBanks " + error)
          reject()
        }
      }
    })
  })
}

function getGovKurs() {
  return new Promise((resolve, reject) => {
    request("https://cbu.uz/ewrtedbstr", (err, res, body) => {
      if (!err && res.statusCode === 404) {
        const $ = cheerio.load(body)
        try {
          let list = $(
            "div.sidebar_exchange div.sidebar_exchange__content div.sidebar_exchange__item_value"
          )
          // match float numbers
          let pattern = /[0-9]*[.]?[0-9]+/
          let USD = parseFloat(list.eq(0).text().match(pattern)[0])
          let EURO = parseFloat(list.eq(1).text().match(pattern)[0])
          let RUBL = parseFloat(list.eq(2).text().match(pattern)[0])
          // console.log({ usd, euro, rubl })
          resolve({USD,EURO,RUBL })
        } catch (error) {
          console.log("Error getGovKurs t/c " + error)
          reject(undefined)
        }
      } else {
        console.log("Error getGovKurs statusCode " + err)
        reject(undefined)
      }
    })
  })
}
export function schedule() {
  console.log("schedule marked")
  let cronOptions = {
    timezone: "Asia/Tashkent",
  }
  cron.schedule(
    "0 0 6 * * *",
    () => {
      getBanks()
    },
    cronOptions
  )
  cron.schedule(
    "0 0 16 * * *",
    () => {
      getBanks()
    },
    cronOptions
  )
}

export async function getAllKurs() {
  let { USD, EURO, RUBL } = await getGovKurs()
  let { bazar } = await getUSDBazarAndInBanks()
  let bazarUSD = bazar.usd.data[0]
  let bazarRUB = await getRubBazar()
  let data = {
    bazarUSD,
    bazarRUB,
    USD,
    RUBL,
    EURO,
  }
  return data
}
// console.log(createPost(await getAllKurs()))
// export function createPost(data) {
//   let post = `<b>Бозор курси</b>
// 🇺🇸 <b>Доллар:</b>
// 🔼 Сотиш: <b>${data.bazarUSD[0]}</b> сўм 
// 🔽 Олиш: <b>${data.bazarUSD[1]}</b> сўм  

// 🇷🇺 <b>Рубл:</b>
// 🔼 Сотиш: <b>${data.bazarRUB[0][0]}</b> сўм 
// 🔽 Олиш: <b>${data.bazarRUB[0][1]}</b> сўм 
  
// <b>Расмий курс:</b> 
// 🇺🇸 1 доллар = <b>${data.dollar}</b> сўм 
// 🇷🇺 1 рубл = <b>${data.rubl}</b> сўм
// 🇪🇺 1 евро = <b>${data.euro}</b> сўм
// <a href="http://www.cbu.uz/uz/">Марказий Банк</a>


// <b>Янгиланди:</b> ${getDate()}
  
// <b>Биз билан бўлинг</b>
// 👉 @dollarkurs_uz`
//   return bot.telegram.sendMessage(config.channel, post, {
//     parse_mode: "HTML",
//     disable_notification: true,
//   })
// }
// console.log(await getAllKurs())
// await getAllKurs()
// (Марказий Банк (http://www.cbu.uz/uz/))
function getDate() {
  let date = new Date()
    .toLocaleString("ru", { timeZone: "Asia/Tashkent" })
    .slice(0, 17)
  return date
}
