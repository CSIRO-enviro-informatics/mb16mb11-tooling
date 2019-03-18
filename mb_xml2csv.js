
const xml2csv = require('xml2csv')
 
xml2csv(
  {
    xmlPath: 'features.xml',
    csvPath: 'mb2011_areas.csv',
    rootXMLElement: 'MB:MB',
    headerMap: [
      ['MB:MB_CODE_2011', 'code2011', 'string'],
      ['MB:Shape_Area', 'area', 'integer'],
    ]
  },
  function (err, info) {
    console.log(err, info)
  }
)