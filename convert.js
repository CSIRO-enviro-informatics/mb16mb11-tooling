//Takes the MB2011 -> 2016 area base correspondence table and converts to linked data

const fs = require('fs');
const transform = require('stream-transform')
const parseXlsx = require('excel').default;
const xlsx = require('node-xlsx').default;
const parseCSV = require('csv-parse/lib/sync')

const N3 = require('n3');
const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;
const DATA_DIR = "/Users/sea066/data/loci/abs/asgs/";
var files = fs.readdirSync(DATA_DIR).filter(x => x.endsWith("xlsx"));

const sheetIds = ['Table 3', 'Table 4', 'Table 5']
const dataIndexs = { code2011: 0, code2016: 2, perc: 5 };
const START_INDEX = 7;

var stmtCount = 0;
function rowOverlaps({ code2011, code2016, perc }) {
    var area2011 = +areaObjs[code2011];
    var areaOverlap = area2011 * perc / 100;
    stmtCount++;
    return `:i${stmtCount} a f: ;
    dbp:area [ 
        nv: ${areaOverlap} ;
        qu: m2: ] .

:m11o${stmtCount} s: mb11:${code2016} ;
    p: c: ;
    o: :i${stmtCount} ;
    m: :m1 .

:m16o${stmtCount} s: mb16:${code2016} ;
    p: c: ;
    o: :i${stmtCount} ;
    m: :m1 .`;
}

//It looks like there are no 2016 MB that overlap a null 2016 area.
var csv = fs.readFileSync(`data/mb2011_areas.csv`, 'utf8');
var areas2011 = parseCSV(csv, {
    columns: true,
    skip_empty_lines: true
});
// csv = fs.readFileSync(`data/mb2016_areas.csv`, 'utf8');
// var areas2016 = parseCSV(csv, {
//     columns: true,
//     skip_empty_lines: true
// });
let areaObjs = areas2011.filter(x => x.code2011).reduce((m, x) => {
    m[x.code2011] = x.area;
    return m;
}, {});
delete csv;
delete areas2011;

var outStream = fs.createWriteStream("all.ttl");

async function main() {
    for (let file of files) {
        if(file.includes('~')) //ignore backups
            continue;

        var filePath = `${DATA_DIR}${file}`;        
        console.log(`Converting ${filePath}`);
        const sheets = xlsx.parse(filePath, {raw: true});

        var allRowsForFile = [];

        for (let sheetId of sheetIds) {
            var rows = sheets.find(x => x.name == sheetId).data;
            rows.splice(0, START_INDEX);

            await writeRows(rows);
        }

    }

    outStream.close();
}


async function writeRows(rows) {
    return new Promise((resolve, reject) => {
        var i = rows.length;
        var count = 0;
        dowrite();
        async function dowrite() {
            let ok = true;
            do {
                --i;
                let row = rows[i];
                var rowObj = Object.keys(dataIndexs).reduce((mem, prop) => {
                    mem[prop] = row[dataIndexs[prop]];
                    return mem;
                }, {});

                if (!rowObj.perc || !rowObj.code2011) //blank rows
                    continue;

                count++;
                const ttl = rowOverlaps(rowObj);
                if (i == 0) {
                    outStream.write(ttl + "\n\n", (err) => { err ? reject(err) : resolve() });
                    console.log(`Wrote #${count} records`);
                } else {
                    ok = outStream.write(ttl + "\n\n");
                }
            } while (i > 0 && ok);
            if (i > 0) {
                outStream.once('drain', dowrite);
            } else {
                resolve();
            }
        }
    });
}

main();
