#! /bin/bash

#used to extract the 2011 MB areas from the WFS service
curl https://geo.abs.gov.au/arcgis/services/ASGS2011/MB/MapServer/WFSServer\?request\=GetFeature\&typeName\=MB\&version\=1.1.0\&propertyname\=MB_CODE_2011,Shape_Area > features.xml

node mb_xml2csv.js