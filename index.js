const axios = require("axios");
const moment = require("moment");
const TelegramBot = require("node-telegram-bot-api");
const beep = require("beepbeep");
if (process.env.NODE_ENV !== 'heroku') {
    require('dotenv').config();
}

const apiUrl = "https://cdn-api.co-vin.in/api";
const testUrl = 'https://api.demo.co-vin.in/api';
const NoidaId = 650; // Noida
const GhaziabadId = 651; // Ghaziabad
const EastDelhiId = 145; // East Delhi

const token = process.env.BOT_TOKEN;
var chatId = [];

const bot = new TelegramBot(token, { polling: true });
const VaccineType = "COVAXIN"; //COVAXIN, COVISHIELD

var today = new Date();

var getSlotData = (date) => {
    axios.get(apiUrl + "/v2/appointment/sessions/public/calendarByDistrict", {
        params: {
            district_id: GhaziabadId,
            date: moment(date).format("DD-MM-YYYY")
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
        }
    }).then(res => filterData(res.data, date));
}

var filterData = (data, date) => {
    console.log("checking for date : ", moment(date).format("DD-MM-YYYY"), "total records : ", data.centers.length);
    data.centers.forEach(center => {
        let records = center.sessions.filter(x => x.available_capacity > 0 && x.date == moment(date).format("DD-MM-YYYY"));
        let records1 = records.length > 0 ? records.filter(x => x.vaccine == "COVAXIN" && x.min_age_limit == 45) : [];
        let records2 = records.length > 0 ? records.filter(x => x.min_age_limit < 45) : [];

        if (records1.length > 0 || records2.length > 0) {
            records1.length > 0 && records1.forEach(x => {
                console.log("\x1b[32m", "Slot available at ", center.pincode, center.name, x.available_capacity);
                if (chatId.length > 0)
                    chatId.forEach(x => bot.sendMessage(x, `Date: ${moment(date).format("DD-MM-YYYY")} \n Slot available at ${center.pincode} ${center.name} capacity : ${x.available_capacity}`));
            });
            records2.length > 0 && records2.forEach(x => {
                console.log("\x1b[32m", "Slot available for 18-44 at ", center.pincode, center.name, x.available_capacity, x.vaccine)
                if (chatId.length > 0)
                    chatId.forEach(x => bot.sendMessage(x, `Date: ${moment(date).format("DD-MM-YYYY")} \n Slot available for 18-44 at ${center.pincode} ${center.name}, capacity : ${x.available_capacity}, vaccine: ${x.vaccine}`));
            });
            beep();
        }

    });
}

async function fetchData() {
    console.clear();
    for (var i of [0, 1, 3, 5, 7, 9, 11, 13]) {
        var date = new Date();
        date.setDate(parseInt(today.getDate()) + parseInt(i));
        getSlotData(date)
        if (i != 13)
            await sleep(5000);
    }
}

var sleep = (time) => {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res();
        }, time);
    })
}

bot.on('message', (msg) => {
    if (!chatId.includes(msg.chat.id))
        chatId.push(msg.chat.id);
    console.log('msg recieved');
    bot.sendMessage(chatId, 'Received your message');
});

bot.on("polling_error", console.log);

fetchData();
setInterval(fetchData, 2 * 60 * 1000);