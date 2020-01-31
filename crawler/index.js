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

const provinces = ['北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江','上海','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南','广东','广西','海南','重庆','四川','贵州','云南','西藏','陕西','甘肃','青海','宁夏','新疆', '香港', '澳门', '台湾'];

const dataLocationInPage = [
    {pageID: 342924, confirmed: 4, suspected: 13, death: 9, recovered: 7, provinceOffset: 1}, //6月9日
    {pageID: 342345, confirmed: 4, suspected: 13, death: 9, recovered: 7, provinceOffset: 0}, //6月8日
    {pageID: 330197, confirmed: 4, suspected: 14, death: 10, recovered: 8, provinceOffset: 1}, //5月15日
    {pageID: 328349, confirmed: 3, suspected: 12, death: 9, recovered: 7, provinceOffset: 1}, //5月12日
    {pageID: 327813, confirmed: 4, suspected: 13, death: 10, recovered: 8, provinceOffset: 0}, //5月11日
    {pageID: 324051, confirmed: 3, suspected: 12, death: 9, recovered: 7, provinceOffset: 1}, //5月2日
    {pageID: 321948, confirmed: 3, suspected: 11, death: 9, recovered: 7, provinceOffset: 1}, //4月29日
    {pageID: 320257, confirmed: 3, suspected: 7, death: 9, recovered: 11, provinceOffset: 0}, //4月25日
    {pageID: 318290, confirmed: 5, suspected: 8, death: 7, recovered: 6, provinceOffset: 0}, //4月21日
];

//整理自
//http://www.china.com.cn/chinese/zhuanti/feiyan/325381.htm
//http://web.archive.org/web/20030509203358/http://www.china.com.cn/chinese/zhuanti/feiyan/325381.htm
const dateUrls_test = [
    ['6月6日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/341843.htm'],
]
const dateUrls = [
    ['4月21日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/318290.htm'],
    ['4月22日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/318574.htm'],
    ['4月23日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/319457.htm'],
    ['4月24日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/320257.htm'],
    ['4月25日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/320924.htm'],
    ['4月26日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/321187.htm'],
    ['4月27日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/321474.htm'],
    ['4月28日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/321948.htm'],
    ['4月29日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/322738.htm'],
    ['4月30日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/323381.htm'],
    ['5月1日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/323652.htm'],
    ['5月2日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/324051.htm'],
    ['5月3日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/324285.htm'],
    ['5月4日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/324598.htm'],
    ['5月5日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/324808.htm'],
    ['5月6日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/325398.htm'],
    ['5月7日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/326009.htm'],
    ['5月8日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/326489.htm'],
    ['5月9日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/327148.htm'],
    ['5月10日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/327450.htm'],
    ['5月11日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/327813.htm'],
    ['5月12日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/328349.htm'],
    ['5月13日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/328992.htm'],
    ['5月14日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/329578.htm'],
    ['5月15日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/330197.htm'],
    ['5月16日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/330855.htm'],
    ['5月17日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/331217.htm'],
    ['5月18日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/331500.htm'],
    ['5月19日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/332042.htm'],
    ['5月20日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/332683.htm'],
    ['5月21日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/333377.htm'],
    ['5月22日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/333975.htm'],
    ['5月23日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/334762.htm'],
    ['5月24日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/335323.htm'],
    ['5月25日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/335673.htm'],
    ['5月26日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/336231.htm'],
    ['5月27日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/336901.htm'],
    ['5月28日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/337383.htm'],
    ['5月29日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/338074.htm'],
    ['5月30日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/338678.htm'],
    ['5月31日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/339015.htm'],
    ['6月1日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/339210.htm'],
    ['6月2日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/339724.htm'],
    ['6月3日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/340142.htm'],
    ['6月4日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/340807.htm'],
    ['6月5日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/341265.htm'],
    ['6月6日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/341843.htm'],
    ['6月7日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/342139.htm'],
    ['6月8日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/342345.htm'],
    ['6月9日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/342924.htm'],
    ['6月10日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/343652.htm'],
    ['6月11日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/344472.htm'],
    ['6月12日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/345309.htm'],
    ['6月13日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/346143.htm'],
    ['6月14日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/346404.htm'],
    ['6月15日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/346614.htm'],
    ['6月16日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/347381.htm'],
    ['6月17日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/348299.htm'],
    ['6月18日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/349032.htm'],
    ['6月19日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/349857.htm'],
    ['6月20日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/350750.htm'],
    ['6月21日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/351010.htm'],
    ['6月22日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/351222.htm'],
    ['6月23日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/351925.htm'],//基本解除
    ['6月24日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/352763.htm'],
    ['6月25日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/353571.htm'],
    ['6月26日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/354293.htm'],
    ['6月27日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/355098.htm'],
    ['6月28日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/355476.htm'],
    ['6月29日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/355736.htm'],
    ['6月30日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/356538.htm'],
    ['7月1日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/357369.htm'],
    ['7月2日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/358150.htm'],
    ['7月3日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/358922.htm'],
    ['7月4日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/359694.htm'],
    ['7月5日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/360013.htm'],
    ['7月6日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/360178.htm'],
    ['7月7日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/360864.htm'],
    ['7月8日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/361675.htm'],
    ['7月9日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/362496.htm'],
    ['7月10日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/363388.htm'],
    ['7月11日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/364126.htm'],
    ['7月12日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/364494.htm'],
    ['7月13日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/364734.htm'],
    ['7月14日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/365561.htm'],
    ['7月15日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/366305.htm'],
    ['7月16日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/367129.htm'],
    ['7月17日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/367975.htm'],
    ['7月18日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/368838.htm'],
    ['7月19日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/368977.htm'],
    ['7月20日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/369125.htm'],
    ['7月21日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/369847.htm'],
    ['7月22日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/370671.htm'],
    ['7月23日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/371461.htm'],
    ['7月24日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/372297.htm'],
    ['7月25日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/373195.htm'],
    ['7月26日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/373435.htm'],
    ['7月27日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/373615.htm'],
    ['7月28日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/374394.htm'],
    ['7月29日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/375366.htm'],
    ['7月30日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/376146.htm'],
    ['7月31日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/376822.htm'],
    ['8月1日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/377558.htm'],
    ['8月2日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/377891.htm'],
    ['8月3日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/378111.htm'],
    ['8月4日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/378935.htm'],
    ['8月5日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/379861.htm'],
    ['8月6日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/380520.htm'],
    ['8月7日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/381412.htm'],
    ['8月8日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/382071.htm'],
    ['8月9日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/382314.htm'],
    ['8月10日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/382531.htm'],
    ['8月11日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/383264.htm'],
    ['8月12日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/383997.htm'],
    ['8月13日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/384717.htm'],
    ['8月14日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/385415.htm'],
    ['8月15日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/386182.htm'],
    ['8月16日', 'http://www.china.com.cn/chinese/zhuanti/feiyan/386426.htm'],     
]

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

function extractCountryData(dataLocation, decodedBody) {
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

function toNumber(str) {
    let num = parseInt(str.trim());
    if (isNaN(num)) {
        num = 0;
    }
    return num;
}

function getValidProvince(str) {
    for (let province of provinces ) {
        if (str.indexOf(province) === 0) {
            return province;
        }
    }
    return '未知';
}

function extractProvincesData(pageID, dataLocation, decodedBody) {
    const $ = cheerio.load(decodedBody);
    const provincesFilter = function() {
        const text = $(this).text().trim();
        for (let province of provinces ) {
            if (text.indexOf(province) === 0) {
                return true;
            }
        }
        return false;
    };
    const datas = [];
    $('tbody > tr > td').filter(provincesFilter)
        .closest('tr').each(function () {
            let recordLine = $(this);
            const data = {};
            data.name = getValidProvince(recordLine.find('td').filter(provincesFilter).text().trim());
            const confirmed = toNumber(recordLine.find(`td:nth-child(${dataLocation.confirmed + dataLocation.provinceOffset})`).text()); //确诊
            const death = toNumber(recordLine.find(`td:nth-child(${dataLocation.death + dataLocation.provinceOffset})`).text()); //死亡
            const recovered = toNumber(recordLine.find(`td:nth-child(${dataLocation.recovered + dataLocation.provinceOffset})`).text()); //治愈
            data.value = confirmed - death - recovered; //确诊且在在治疗的
            if (data.value !== 0) {
                datas.push(data);
            }
        });

    return datas;   
}

function printProvincesData(date, provincesData) {
    const dateFormated = date.replace(/(\d+)月(\d+)日/, '2003-$1-$2');
    console.log(`'${dateFormated}': ${JSON.stringify(provincesData)},`);
}

function parseOnePage(url, dataLocation, date) {
    return fetchWebPage(url, "GB2312")
        .then(function (pageContent) {
            const $ = cheerio.load(pageContent.decodedBody);
            //console.log(`['${date}, '${url}'],`);
            const countryData = extractCountryData(dataLocation, pageContent.decodedBody);
            countryData["date"] = date;
            const output = `['${date}', '${countryData.confirmed}', '${countryData.suspected}', '${countryData.death}', '${countryData.recovered}'],`;
            //console.log(output);
            const pageID = extracePageID(url);
            const provincesData = extractProvincesData(pageID, dataLocation, pageContent.decodedBody);
            printProvincesData(date, provincesData);
            return countryData;
        });
}

function parseAllDataPage() {
    let allDays = [];
    for (let dateUrl of dateUrls) {
        const date = dateUrl[0];
        const url = dateUrl[1];
        const pageID = extracePageID(url);
        const dataLocation = getDataLocationInPage(pageID);
        if (dataLocation) {
            allDays.push({url: url, dataLocation: dataLocation, date: date});
        }
    }

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
}

parseAllDataPage();

function parseMenuPage() {
    fetchWebPage("http://www.china.com.cn/chinese/zhuanti/feiyan/325381.htm")
        .then(function(pageContent) {
            const $ = cheerio.load(pageContent.decodedBody);
            const calendar = $("body > table:nth-child(1) > tbody > tr > td:nth-child(2) > table:nth-child(3) > tbody > tr > td:nth-child(3) > table:nth-child(6) > tbody > tr > td > table > tbody > tr:nth-child(5) > td > table > tbody");
            $($(calendar).find("tr > td > div > a").get().reverse()).each((index, element) => {
                const url = `http://www.china.com.cn${$(element).attr("href")}`;
                const date = $(element).text();
                console.log(`['${date}', '${url}'],`);
            });
        })
        .catch(e => console.error(e));
}
