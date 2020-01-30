const http       = require('http');

const cheerio    = require('cheerio');
const iconv      = require('iconv-lite');
const co         = require('co');

function fetchWebPage(url, charset) {
    if (!charset) {
        charset = "utf8";
    }
    const promise = new Promise(function(resolve, reject) {
        let clientRequest = http.get(url, function(res) {
            const { statusCode } = res;
            if (statusCode !== 200) {
                res.resume();
                return reject(new Error('Request Failed. ' + `Status Code: ${statusCode} ` + url));
            }
            var chunks = [];
            res.on('data', function(chunk) {
                chunks.push(chunk);
            });
            res.on('end', function() {
                let decodedBody = "";
                try {
                    decodedBody = iconv.decode(Buffer.concat(chunks), charset);
                } catch(e) {
                    return reject(e);
                }

                return resolve({"url":url, "decodedBody":decodedBody});
            });
            res.on('error', function(e) {
                reject(e);
            });
        });
        clientRequest.setTimeout(10000, function() {
            reject(new Error('Request Timeout. ' + url));
        });
        clientRequest.on('error', function(e) {
            reject(e);
        });         
    });
    return promise;
}

//http://www.china.com.cn/chinese/zhuanti/feiyan/320257.htm
//http://www.china.com.cn/chinese/zhuanti/feiyan/320924.htm
//body > table:nth-child(1) > tbody > tr > td:nth-child(2) > table:nth-child(3) > tbody > tr > td:nth-child(3) > table:nth-child(7) > tbody > tr > td > div > table > tbody > tr:last-child
//body > table:nth-child(1) > tbody > tr > td:nth-child(2) > table:nth-child(3) > tbody > tr > td:nth-child(3) > table:nth-child(7) > tbody > tr > td > table > tbody > tr:nth-child(4) > td > table > tbody > tr:nth-child(29)
//body > table:nth-child(1) > tbody > tr > td:nth-child(2) > table:nth-child(3) > tbody > tr > td:nth-child(3) > table:nth-child(7) > tbody > tr > td > table:nth-child(3) > tbody > tr:nth-child(30) > td:nth-child(1)

const dataLocationInPage = [
    {pageID: 342345, confirmed: 4, suspected: 13, death: 9, recovered: 7}, //6月8日
    {pageID: 330197, confirmed: 4, suspected: 14, death: 10, recovered: 8}, //5月15日
    {pageID: 328349, confirmed: 3, suspected: 12, death: 9, recovered: 7}, //5月12日
    {pageID: 327813, confirmed: 4, suspected: 13, death: 10, recovered: 8}, //5月11日
    {pageID: 324051, confirmed: 3, suspected: 12, death: 9, recovered: 7}, //5月2日
    {pageID: 321948, confirmed: 3, suspected: 11, death: 9, recovered: 7}, //4月29日
    {pageID: 320257, confirmed: 3, suspected: 7, death: 9, recovered: 11}, //4月25日
    {pageID: 318290, confirmed: 5, suspected: 8, death: 7, recovered: 6}, //4月21日
];

function getDataLocationInPage(pageID) {
    for (const dataLocation of dataLocationInPage) {
        if (pageID >= dataLocation.pageID) {
            return dataLocation;
        }
    }
    return null;
}

function extracePageID(url) {
    return parseInt(url.match(/\/(\d+)\./)[1]);
}

function extractData(dataLocation, decodedBody) {
    const $ = cheerio.load(decodedBody);
    const total_tr = $("tbody > tr:last-child > td:nth-child(1)").filter(function() {
        const text = $(this).text().trim();
        return text === '总计' || text === '总 计'
            || text === '合计' || text.indexOf('合 计') === 0
            || text.indexOf('累 计') === 0
            || text === '全国(内地)';
    }).closest("tr");
    const data = {};
    data.confirmed = $(total_tr).find(`td:nth-child(${dataLocation.confirmed})`).text().trim(); //确诊
    data.suspected = $(total_tr).find(`td:nth-child(${dataLocation.suspected})`).text().trim(); //疑似
    data.death = $(total_tr).find(`td:nth-child(${dataLocation.death})`).text().trim(); //死亡
    data.recovered = $(total_tr).find(`td:nth-child(${dataLocation.recovered})`).text().trim(); //治愈

    return data;
}

function parseOnePage(url, dataLocation, date) {
    return fetchWebPage(url, "GB2312")
        .then(function (pageContent) {
            const $ = cheerio.load(pageContent.decodedBody);
            console.log("link: %s date:%s", url, date);
            const data = extractData(dataLocation, pageContent.decodedBody);
            data["date"] = date;
            console.log(`confirmed: %d suspected: %d death: %d recovered: %d`,
                data.confirmed, data.suspected, data.death, data.recovered);
            return data;
        });
}

//parseOnePage("http://www.china.com.cn/chinese/zhuanti/feiyan/318290.htm", "日期");

fetchWebPage("http://www.china.com.cn/chinese/zhuanti/feiyan/325381.htm")
    .then(function(pageContent) {
        const $ = cheerio.load(pageContent.decodedBody);
        const calendar = $("body > table:nth-child(1) > tbody > tr > td:nth-child(2) > table:nth-child(3) > tbody > tr > td:nth-child(3) > table:nth-child(6) > tbody > tr > td > table > tbody > tr:nth-child(5) > td > table > tbody");
        let allDays = [];
        $($(calendar).find("tr > td > div > a").get().reverse()).each((index, element) => {
            const url = `http://www.china.com.cn${$(element).attr("href")}`;
            const date = $(element).text();
            const pageID = extracePageID(url);
            const dataLocation = getDataLocationInPage(pageID);
            if (dataLocation) {
                allDays.push({url: url, dataLocation: dataLocation, date: date});
            }
        });
        function* allDaysDataGen() {
            let allData = [];
            for (let oneDay of allDays) {
                let data = yield parseOnePage(oneDay.url, oneDay.dataLocation, oneDay.date);
                allData.push(data);
            }
            return allData;
        }
        co(allDaysDataGen)
            .then(function (allData) {
                console.log(allData);
            });
    })
    .catch(e => console.error(e));
