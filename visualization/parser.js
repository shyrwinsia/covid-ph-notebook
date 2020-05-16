'use strict';

const fs = require('fs');

let rawdata = fs.readFileSync('../site/ph.json');
let geo = JSON.parse(rawdata);
let mappingrawdata = fs.readFileSync('mapping.json');
let mapping = JSON.parse(mappingrawdata);

for (let x = 0; x < geo.objects.ph.geometries.length; x++) {
  let entry = geo.objects.ph.geometries[x].properties
  if (entry.TYPE_2 != "Waterbody") {
    let id = entry.NAME_1 + entry.NAME_2
    id = id.replace(/[^A-Za-zÑñ]/gi, '')
    let adminCode = mapping[id]
    if (adminCode) {
      entry.ADMIN_CODE = adminCode
    } else {
      console.log(id)
    }
  }
}

// for (let x = 0; x < geo.objects.ph.geometries.length; x++) {
//   let entry = geo.objects.ph.geometries[x].properties
//   if (entry.TYPE_2 != "Waterbody") {
//     let adminCode = entry.ADMIN_CODE
//     if (adminCode) {
//       console.log(geo.objects.ph.geometries[x])
//     }
//   }
// }
// Check dumalag

fs.writeFileSync('edited.json', JSON.stringify(geo))

