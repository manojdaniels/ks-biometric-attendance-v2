// utils/generateCSV.js
const { Parser } = require('json2csv');


const generateCSV=(data, fields)=> {
  const json2csvParser = new Parser({ fields });
  return json2csvParser.parse(data);
}

module.exports=generateCSV;
