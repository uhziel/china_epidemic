const axios = require('axios');
const fs = require('fs');

function getNowString() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}T${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
}
const nowString = getNowString();

const loadCountries = async data => {
  const countries = data
    .match(/window.getListByCountryTypeService2 = (.*?)}catch/)[1];
  fs.writeFileSync(`./rawdata/${nowString}_countries.json`, countries);
};

const loadAreas = async data => {
  const areas = data
    .match(/window.getAreaStat = (.*?)}catch/)[1];
  fs.writeFileSync(`./rawdata/${nowString}_areas.json`, areas);
}

let times = 0
async function request () {
  return axios.request('https://3g.dxy.cn/newh5/view/pneumonia').then
  ( response => {
    return Promise.all([
      loadCountries(response.data),
      loadAreas(response.data)
    ])
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
