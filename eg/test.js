'use strict';
const util = require('util')
require('babel-polyfill');

const Export = require('../Export').default;

const exportOutput = async (accesskey, secretaccesskey, region) => {
  let result;
  try {
    const exporter = new Export();
    result = await exporter.run(accesskey, secretaccesskey, region);
  } catch (err) {
    console.error(err)
  };
  return result;
};

let data = [ 'AKIAIMDEUMNQTW56VI2Q', 'nLLAJiGwgLPHUmW2VP/jCXdMQDFhlJbqlRyNZzF6', 'ap-northeast-2' ];

(async() => {
  const output = await exportOutput(...data);
  console.log(util.inspect(output, false, null));
})();


