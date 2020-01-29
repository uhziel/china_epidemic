const http       = require("http");

const cheerio    = require("cheerio");
const iconv      = require("iconv-lite");

function fetchWebPage(url, charset) {
    if (!charset) {
        charset = "utf8";
    }
    const promise = new Promise(function(resolve, reject) {
        http.get(url, function(res) {
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
            res.on("error", function(e) {
                return reject(e);
            });
        });         
    });
    return promise;
}

//http://www.china.com.cn/chinese/zhuanti/feiyan/320257.htm
//http://www.china.com.cn/chinese/zhuanti/feiyan/320924.htm
//body > table:nth-child(1) > tbody > tr > td:nth-child(2) > table:nth-child(3) > tbody > tr > td:nth-child(3) > table:nth-child(7) > tbody > tr > td > div > table > tbody > tr:last-child
//body > table:nth-child(1) > tbody > tr > td:nth-child(2) > table:nth-child(3) > tbody > tr > td:nth-child(3) > table:nth-child(7) > tbody > tr > td > table > tbody > tr:nth-child(4) > td > table > tbody > tr:nth-child(29)

function parseOnePage(url, date) {
    fetchWebPage(url, "GB2312")
        .then(function (pageContent) {
            const $ = cheerio.load(pageContent.decodedBody);
            const total_tr = $("b").filter(function() {
                return $(this).text() === "总计" || $(this).text() === "总 计";
            }).closest("tr");
            console.log("link:%s date:%s", url, date);
            const confirmed = $(total_tr).find("td:nth-child(3)").text();
            const suspected = $(total_tr).find("td:nth-child(7)").text();
            const death = $(total_tr).find("td:nth-child(9)").text();
            const recovered = $(total_tr).find("td:nth-child(11)").text();
            console.log("confirmed:%d suspected:%d death:%d recovered:%d", confirmed, suspected, death, recovered);
        })
        .catch(e => console.error(e));
}

/*
fetchWebPage("http://www.china.com.cn/chinese/zhuanti/feiyan/320257.htm", "GB2312")
    .then(parseOnePage)
    .catch(error => console.error(error));
*/

fetchWebPage("http://www.china.com.cn/chinese/zhuanti/feiyan/325381.htm")
    .then(function(pageContent) {
        const $ = cheerio.load(pageContent.decodedBody);
        const calendar = $("body > table:nth-child(1) > tbody > tr > td:nth-child(2) > table:nth-child(3) > tbody > tr > td:nth-child(3) > table:nth-child(6) > tbody > tr > td > table > tbody > tr:nth-child(5) > td > table > tbody");
        $($(calendar).find("tr > td > div > a").get().reverse()).each((index, element) => {
            const url = `http://www.china.com.cn${$(element).attr("href")}`;
            const date = $(element).text();
            parseOnePage(url, date);
        });         
    })
    .catch(e => console.error(e));