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

function extractData(url, decodedBody) {
    const $ = cheerio.load(decodedBody);
    const pageID = parseInt(url.match(/\/(\d+)\./)[1]);
    const total_tr = $("tr > td:nth-child(1)").filter(function() {
        const text = $(this).text().trim();
        return text === '总计' || text === '总 计'
            || text === '合计' || text.indexOf('合 计') === 0
            || text === '全国(内地)';
    }).closest("tr");
    const data = {};
    if (pageID <= 319457) { //4月24
        data.confirmed = $(total_tr).find("td:nth-child(5)").text().trim(); //确诊
        data.suspected = $(total_tr).find("td:nth-child(8)").text().trim(); //疑似
        data.death = $(total_tr).find("td:nth-child(7)").text().trim(); //死亡
        data.recovered = $(total_tr).find("td:nth-child(6)").text().trim(); //治愈
    } else if (pageID <= 321474) { //4月28日
        data.confirmed = $(total_tr).find("td:nth-child(3)").text().trim(); //确诊
        data.suspected = $(total_tr).find("td:nth-child(7)").text().trim(); //疑似
        data.death = $(total_tr).find("td:nth-child(9)").text().trim(); //死亡
        data.recovered = $(total_tr).find("td:nth-child(11)").text().trim(); //治愈
    } else if (pageID <= 323381) { //5月1日
        data.confirmed = $(total_tr).find("td:nth-child(3)").text().trim(); //确诊
        data.suspected = $(total_tr).find("td:nth-child(11)").text().trim(); //疑似
        data.death = $(total_tr).find("td:nth-child(9)").text().trim(); //死亡
        data.recovered = $(total_tr).find("td:nth-child(7)").text().trim(); //治愈
    } else if (pageID <= 327450) { //5月10日
        data.confirmed = $(total_tr).find("td:nth-child(3)").text().trim(); //确诊
        data.suspected = $(total_tr).find("td:nth-child(12)").text().trim(); //疑似
        data.death = $(total_tr).find("td:nth-child(9)").text().trim(); //死亡
        data.recovered = $(total_tr).find("td:nth-child(7)").text().trim(); //治愈
    } else if (pageID <= 327813) { //5月11日
        data.confirmed = $(total_tr).find("td:nth-child(4)").text().trim(); //确诊
        data.suspected = $(total_tr).find("td:nth-child(13)").text().trim(); //疑似
        data.death = $(total_tr).find("td:nth-child(10)").text().trim(); //死亡
        data.recovered = $(total_tr).find("td:nth-child(8)").text().trim(); //治愈
    } else if (pageID <= 329578) { //5月14日
        data.confirmed = $(total_tr).find("td:nth-child(3)").text().trim(); //确诊
        data.suspected = $(total_tr).find("td:nth-child(12)").text().trim(); //疑似
        data.death = $(total_tr).find("td:nth-child(9)").text().trim(); //死亡
        data.recovered = $(total_tr).find("td:nth-child(7)").text().trim(); //治愈
    } else {
        data.confirmed = $(total_tr).find("td:nth-child(4)").text().trim(); //确诊
        data.suspected = $(total_tr).find("td:nth-child(14)").text().trim(); //疑似
        data.death = $(total_tr).find("td:nth-child(10)").text().trim(); //死亡
        data.recovered = $(total_tr).find("td:nth-child(8)").text().trim(); //治愈
    }
    return data;
}

function parseOnePage(url, date) {
    return fetchWebPage(url, "GB2312")
        .then(function (pageContent) {
            const $ = cheerio.load(pageContent.decodedBody);
            console.log("link: %s date:%s", url, date);
            const data = extractData(pageContent.url, pageContent.decodedBody);
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
            allDays.push({url: url, date: date});
        });
        function* allDaysDataGen() {
            let allData = [];
            for (let oneDay of allDays) {
                let data = yield parseOnePage(oneDay.url, oneDay.date);
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
