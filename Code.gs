/* =====================================================
   BUENACRUZ — Google Apps Script Backend
   Reemplaza SheetDB. Pegá este código en:
   Extensions → Apps Script → Código.gs
   Luego: Implementar → Nueva implementación → Aplicación web
     - Ejecutar como: Yo
     - Quién tiene acceso: Cualquier persona
   Copiá la URL /exec y pegala en main.js y admin.html
   ===================================================== */

var SHEET_NAME = "Productos";

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function rowToObj(headers, row) {
  var obj = {};
  headers.forEach(function(h, i) { obj[h] = row[i] !== undefined ? String(row[i]) : ""; });
  return obj;
}

function getAllRows() {
  var sheet = getSheet();
  var headers = getHeaders(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return data.map(function(row) { return rowToObj(headers, row); });
}

function ok(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function err(msg) {
  return ContentService.createTextOutput(JSON.stringify({ error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ─── GET: listar todos los productos ─── */
function doGet(e) {
  try {
    var rows = getAllRows();
    return ok(rows);
  } catch(ex) {
    return err(ex.message);
  }
}

/* ─── POST / PATCH / DELETE via _method en el body ─── */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var method = (body._method || "POST").toUpperCase();

    if (method === "POST")   return handlePost(body);
    if (method === "PATCH")  return handlePatch(body);
    if (method === "DELETE") return handleDelete(body);

    return err("Método no soportado: " + method);
  } catch(ex) {
    return err(ex.message);
  }
}

/* ─── Agregar producto ─── */
function handlePost(body) {
  var sheet = getSheet();
  var headers = getHeaders(sheet);
  var row = headers.map(function(h) { return body[h] !== undefined ? body[h] : ""; });
  sheet.appendRow(row);
  return ok({ created: 1 });
}

/* ─── Editar producto (busca por nombre original _target) ─── */
function handlePatch(body) {
  var sheet   = getSheet();
  var headers = getHeaders(sheet);
  var lastRow = sheet.getLastRow();
  var prodIdx = headers.indexOf("producto");
  if (prodIdx === -1) return err("Columna 'producto' no encontrada");

  var target  = body._target;
  var updated = 0;

  for (var i = 2; i <= lastRow; i++) {
    var cell = sheet.getRange(i, prodIdx + 1).getValue();
    if (String(cell).trim() === String(target).trim()) {
      headers.forEach(function(h, idx) {
        if (body[h] !== undefined) {
          sheet.getRange(i, idx + 1).setValue(body[h]);
        }
      });
      updated++;
      break;
    }
  }
  return ok({ updated: updated });
}

/* ─── Eliminar producto (busca por nombre _target) ─── */
function handleDelete(body) {
  var sheet   = getSheet();
  var headers = getHeaders(sheet);
  var lastRow = sheet.getLastRow();
  var prodIdx = headers.indexOf("producto");
  if (prodIdx === -1) return err("Columna 'producto' no encontrada");

  var target  = body._target;
  var deleted = 0;

  for (var i = lastRow; i >= 2; i--) {
    var cell = sheet.getRange(i, prodIdx + 1).getValue();
    if (String(cell).trim() === String(target).trim()) {
      sheet.deleteRow(i);
      deleted++;
      break;
    }
  }
  return ok({ deleted: deleted });
}
