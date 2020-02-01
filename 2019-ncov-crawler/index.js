const axios = require('axios');
const fs = require('fs');
const md5 = require('md5');

function getNowString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}T${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
}
const nowString = getNowString();

function loadCountries(data) {
  const countries = data
    .match(/window.getListByCountryTypeService2 = (.*?)}catch/)[1];
  return countries;
  
}

function loadAreas(data) {
  const areas = data
    .match(/window.getAreaStat = (.*?)}catch/)[1];
  return areas;
  
}

function getLastMd5() {
  try {
    return fs.readFileSync('./rawdata/last_md5.txt', {encoding: 'utf8'});
  } catch (e) {
    console.error(e);
    return "";
  }
}

function saveData(countries, areas, curMd5) {
  fs.writeFileSync(`./rawdata/${nowString}_countries.json`, countries);
  fs.writeFileSync(`./rawdata/${nowString}_areas.json`, areas);
  fs.writeFileSync('./rawdata/last_md5.txt', curMd5);
}

let times = 0
async function request () {
  return axios.request('https://3g.dxy.cn/newh5/view/pneumonia').then
  ( response => {
    const countries = loadCountries(response.data);
    const areas = loadAreas(response.data);
    const curMd5 = md5(countries+areas);
    const lastMd5 = getLastMd5();
    if (lastMd5 !== curMd5) {
      saveData(countries, areas, curMd5);
    }
  }).catch(e => {
    console.log('Retry')
    if (times++ > 3) {
      throw e
    }
    return request();
  })
}

request().catch(e => {
  console.log(e);
  process.exit(1);
})
