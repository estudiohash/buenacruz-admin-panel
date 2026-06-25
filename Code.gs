/* =====================================================
   BUENACRUZ — Google Apps Script Backend
   Columnas: producto, precio_base, categoria, talles,
             colores, stock, descripcion, imagen_url, mostrar_home
   ===================================================== */

var SHEET_ID   = "1L1LhAPObeep6SryPlYcNfHu-xsFRRZLb";
var SHEET_NAME = "Productos";

function getSheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function rowToObj(headers, row) {
  var obj = {};
  headers.forEach(function(h, i) {
    obj[h] = row[i] !== undefined ? String(row[i]) : "";
  });
  return obj;
}

function getAllRows() {
  var sheet   = getSheet();
  var headers = getHeaders(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return data.map(function(row) { return rowToObj(headers, row); });
}

function makeResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ─── GET ─── */
function doGet(e) {
  try {
    return makeResponse(getAllRows());
  } catch(ex) {
    return makeResponse({ error: ex.message });
  }
}

/* ─── POST / PATCH / DELETE ─── */
function doPost(e) {
  try {
    var body   = JSON.parse(e.postData.contents);
    var method = (body._method || "POST").toUpperCase();
    if (method === "POST")   return makeResponse(handlePost(body));
    if (method === "PATCH")  return makeResponse(handlePatch(body));
    if (method === "DELETE") return makeResponse(handleDelete(body));
    return makeResponse({ error: "Método no soportado: " + method });
  } catch(ex) {
    return makeResponse({ error: ex.message });
  }
}

function handlePost(body) {
  var sheet   = getSheet();
  var headers = getHeaders(sheet);
  var row     = headers.map(function(h) {
    return body[h] !== undefined ? body[h] : "";
  });
  sheet.appendRow(row);
  return { created: 1 };
}

function handlePatch(body) {
  var sheet   = getSheet();
  var headers = getHeaders(sheet);
  var lastRow = sheet.getLastRow();
  var prodIdx = headers.indexOf("producto");
  if (prodIdx === -1) return { error: "Columna 'producto' no encontrada" };
  var updated = 0;
  for (var i = 2; i <= lastRow; i++) {
    var cell = String(sheet.getRange(i, prodIdx + 1).getValue()).trim();
    if (cell === String(body._target).trim()) {
      headers.forEach(function(h, idx) {
        if (body[h] !== undefined) sheet.getRange(i, idx + 1).setValue(body[h]);
      });
      updated++;
      break;
    }
  }
  return { updated: updated };
}

function handleDelete(body) {
  var sheet   = getSheet();
  var headers = getHeaders(sheet);
  var lastRow = sheet.getLastRow();
  var prodIdx = headers.indexOf("producto");
  if (prodIdx === -1) return { error: "Columna 'producto' no encontrada" };
  var deleted = 0;
  for (var i = lastRow; i >= 2; i--) {
    var cell = String(sheet.getRange(i, prodIdx + 1).getValue()).trim();
    if (cell === String(body._target).trim()) {
      sheet.deleteRow(i);
      deleted++;
      break;
    }
  }
  return { deleted: deleted };
}
