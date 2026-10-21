const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Proyecto academico Huerta IoT';
pptx.subject = 'Telemetria sintetica de sensores con Docker y Microsoft Fabric';
pptx.title = 'Huerta IoT | De los sensores a la analitica';
pptx.company = 'Proyecto universitario';
pptx.lang = 'es-CO';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'es-CO',
};

const W = 13.333;
const H = 7.5;
const C = {
  ink: '18362D',
  forest: '103B2E',
  forest2: '174D3C',
  leaf: '31845A',
  mint: 'E7F3EC',
  paper: 'F6F8F5',
  white: 'FFFFFF',
  line: 'DCE5DE',
  muted: '65766C',
  blue: '0F6CBD',
  cyan: '32B7C8',
  teal: '038387',
  green: '107C41',
  lime: '78BE20',
  yellow: 'FFB900',
  orange: 'D96B27',
  red: 'C74643',
  purple: '6B4FA1',
  gray: 'E9EEEA',
};

const imagePath = (name) => path.join(__dirname, '..', 'docs', 'images', name);
const outputPath = path.join(__dirname, '..', 'docs', 'Presentacion_Huerta_Fabric.pptx');
const ST = pptx.ShapeType;

function txt(slide, text, x, y, w, h, options = {}) {
  slide.addText(text, {
    x, y, w, h,
    margin: 0,
    fontFace: options.fontFace || 'Aptos',
    fontSize: options.fontSize || 14,
    color: options.color || C.ink,
    bold: options.bold || false,
    breakLine: false,
    valign: options.valign || 'mid',
    align: options.align || 'left',
    fit: 'shrink',
    transparency: options.transparency || 0,
    charSpacing: options.charSpacing || 0,
    paraSpaceAfterPt: options.paraSpaceAfterPt || 0,
    bullet: options.bullet,
    isTextBox: true,
  });
}

function rect(slide, x, y, w, h, fill, radius = false, line = fill, transparency = 0) {
  slide.addShape(radius ? ST.roundRect : ST.rect, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: fill, transparency },
    line: { color: line, transparency: line === fill ? 100 : 0, width: 0.8 },
  });
}

function rule(slide, x1, y1, x2, y2, color = C.line, width = 1, dash = 'solid', arrow = false) {
  slide.addShape(ST.line, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: {
      color,
      width,
      dashType: dash,
      endArrowType: arrow ? 'triangle' : 'none',
    },
  });
}

function addFabricMark(slide, x, y, scale = 1, dark = false) {
  const colors = [C.blue, C.cyan, C.green, C.yellow, C.orange];
  colors.forEach((color, index) => {
    rect(slide, x + (index % 3) * 0.12 * scale, y + Math.floor(index / 3) * 0.12 * scale,
      0.09 * scale, 0.09 * scale, color, true);
  });
  txt(slide, 'FABRIC', x + 0.42 * scale, y - 0.005 * scale, 0.76 * scale, 0.25 * scale, {
    fontSize: 11 * scale,
    bold: true,
    color: dark ? C.white : C.ink,
    charSpacing: 1.2,
  });
}

function addLeaf(slide, x, y, w, h, fill, rotate = 0, transparency = 0) {
  slide.addShape(ST.ellipse, {
    x, y, w, h, rotate,
    fill: { color: fill, transparency },
    line: { color: fill, transparency: 100 },
  });
}

function leafMotif(slide, x, y, scale = 1, dark = false) {
  const stem = dark ? '8FB89A' : C.leaf;
  const soft = dark ? '67A17B' : 'A9D0B6';
  rule(slide, x + 0.68 * scale, y + 1.65 * scale, x + 0.68 * scale, y + 0.2 * scale, stem, 2.2);
  addLeaf(slide, x + 0.04 * scale, y + 0.55 * scale, 0.72 * scale, 0.28 * scale, soft, -28, dark ? 8 : 0);
  addLeaf(slide, x + 0.63 * scale, y + 0.3 * scale, 0.72 * scale, 0.28 * scale, C.lime, 26, dark ? 5 : 0);
  addLeaf(slide, x + 0.02 * scale, y + 1.05 * scale, 0.72 * scale, 0.28 * scale, C.teal, 26, dark ? 8 : 0);
  addLeaf(slide, x + 0.63 * scale, y + 0.85 * scale, 0.72 * scale, 0.28 * scale, soft, -25, dark ? 10 : 0);
  addLeaf(slide, x + 0.11 * scale, y + 1.43 * scale, 0.72 * scale, 0.28 * scale, C.green, -23, dark ? 6 : 0);
}

function addFooter(slide, n, label = 'HUERTA IOT · MICROSOFT FABRIC') {
  rule(slide, 0.58, 7.08, 12.76, 7.08, C.line, 0.7);
  txt(slide, label, 0.62, 7.12, 7.5, 0.18, { fontSize: 8, color: C.muted, bold: true, charSpacing: 1.1 });
  txt(slide, String(n).padStart(2, '0'), 12.15, 7.1, 0.52, 0.22, {
    fontSize: 9, color: C.leaf, bold: true, align: 'right',
  });
}

function baseSlide(section, title, subtitle, n) {
  const slide = pptx.addSlide();
  slide.background = { color: C.paper };
  addFabricMark(slide, 11.75, 0.38, 0.75, false);
  txt(slide, section.toUpperCase(), 0.62, 0.38, 5.8, 0.22, {
    fontSize: 9, color: C.teal, bold: true, charSpacing: 1.8,
  });
  txt(slide, title, 0.62, 0.78, 11.8, 0.56, {
    fontFace: 'Aptos Display', fontSize: 26, color: C.ink, bold: true,
  });
  if (subtitle) {
    txt(slide, subtitle, 0.64, 1.38, 11.7, 0.35, { fontSize: 12, color: C.muted });
  }
  addFooter(slide, n);
  return slide;
}

function card(slide, x, y, w, h, options = {}) {
  rect(slide, x, y, w, h, options.fill || C.white, true, options.line || C.line);
  if (options.accent) rect(slide, x, y + 0.05, 0.07, h - 0.1, options.accent, true);
}

function addKpi(slide, x, y, w, h, value, label, accent, detail = '') {
  card(slide, x, y, w, h, { accent });
  txt(slide, value, x + 0.2, y + 0.16, w - 0.35, 0.55, {
    fontFace: 'Aptos Display', fontSize: 28, bold: true, color: accent,
  });
  txt(slide, label, x + 0.2, y + 0.78, w - 0.35, 0.3, { fontSize: 12, bold: true, color: C.ink });
  if (detail) txt(slide, detail, x + 0.2, y + 1.12, w - 0.35, 0.35, { fontSize: 9, color: C.muted });
}

function pngSize(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.toString('ascii', 1, 4) !== 'PNG') throw new Error(`No es PNG: ${filePath}`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function addImageContain(slide, filePath, x, y, w, h) {
  if (!fs.existsSync(filePath)) throw new Error(`Falta captura requerida: ${filePath}`);
  const { width, height } = pngSize(filePath);
  const scale = Math.min(w / width, h / height);
  const drawW = width * scale;
  const drawH = height * scale;
  slide.addImage({
    path: filePath,
    x: x + (w - drawW) / 2,
    y: y + (h - drawH) / 2,
    w: drawW,
    h: drawH,
  });
}

function addImagePanel(slide, fileName, x, y, w, h, label, accent = C.teal) {
  card(slide, x, y, w, h, { fill: C.white, line: 'D7E0D9', accent });
  addImageContain(slide, imagePath(fileName), x + 0.15, y + 0.14, w - 0.3, h - 0.58);
  txt(slide, label, x + 0.18, y + h - 0.34, w - 0.35, 0.2, { fontSize: 9, color: C.muted, bold: true });
}

function addNotes(slide, notes) {
  slide.addNotes(notes);
}

function slideCover() {
  const slide = pptx.addSlide();
  slide.background = { color: C.forest };
  rect(slide, 0, 0, W, H, C.forest);
  rect(slide, 8.7, 0, 4.7, H, C.forest2, false, C.forest2);
  addFabricMark(slide, 0.72, 0.56, 1.1, true);
  txt(slide, 'PROYECTO UNIVERSITARIO · IOT + ANALITICA', 0.76, 1.52, 6.6, 0.3, {
    fontSize: 10, bold: true, color: 'B8D9C1', charSpacing: 1.7,
  });
  txt(slide, 'Huerta\nIoT', 0.72, 2.0, 6.2, 2.1, {
    fontFace: 'Aptos Display', fontSize: 50, bold: true, color: C.white, valign: 'mid',
  });
  txt(slide, 'De los sensores a la analitica\ncon Microsoft Fabric', 0.78, 4.26, 6.5, 0.84, {
    fontSize: 22, color: 'D5E9DB',
  });
  txt(slide, 'Docker  /  Kafka  /  Eventstream  /  Lakehouse  /  Power BI', 0.8, 5.54, 7.1, 0.35, {
    fontSize: 12, color: C.white, bold: true,
  });

  leafMotif(slide, 10.1, 2.0, 1.55, true);
  addLeaf(slide, 9.1, 5.53, 0.44, 0.2, C.lime, -22, 3);
  addLeaf(slide, 10.0, 5.82, 0.52, 0.22, C.cyan, 19, 3);
  addLeaf(slide, 11.1, 5.5, 0.5, 0.2, C.yellow, -17, 2);
  addLeaf(slide, 12.05, 5.86, 0.42, 0.2, C.orange, 23, 0);
  txt(slide, 'Presentacion del proyecto', 0.8, 6.77, 5.4, 0.24, { fontSize: 9, color: 'B8D9C1' });
  addNotes(slide, 'Apertura: presentar el reto de conectar sensores simulados de una huerta con una plataforma de analitica. Aclarar que la telemetria es sintetica y que la ingesta usa el endpoint Kafka de Fabric, no una API HTTP local.');
}

function slideStory() {
  const slide = baseSlide('01 · Contexto', 'De lecturas aisladas a una historia analitica', 'El objetivo es simular el recorrido completo: generar, ingerir, depurar, agregar y presentar telemetria.', 2);
  const items = [
    { n: '01', color: C.blue, title: 'Generar', body: 'Sensores virtuales producen lecturas con fecha, parcela y variables ambientales.' },
    { n: '02', color: C.teal, title: 'Confiar', body: 'Bronze conserva la entrada; Silver tipa, valida, deduplica y aparta anomalias.' },
    { n: '03', color: C.orange, title: 'Entender', body: 'Gold resume el comportamiento por fecha, parcela y cultivo para Power BI.' },
  ];
  items.forEach((item, i) => {
    const x = 0.7 + i * 4.2;
    card(slide, x, 2.12, 3.72, 2.42, { accent: item.color });
    txt(slide, item.n, x + 0.24, 2.36, 0.76, 0.5, { fontFace: 'Aptos Display', fontSize: 25, bold: true, color: item.color });
    txt(slide, item.title, x + 0.24, 3.0, 3.15, 0.42, { fontSize: 19, bold: true, color: C.ink });
    txt(slide, item.body, x + 0.24, 3.54, 3.15, 0.66, { fontSize: 12, color: C.muted, valign: 'top' });
  });
  rect(slide, 0.72, 5.12, 11.95, 1.05, C.mint, true, C.mint);
  txt(slide, 'Pregunta guia', 0.98, 5.36, 1.55, 0.25, { fontSize: 10, bold: true, color: C.leaf, charSpacing: 1 });
  txt(slide, '¿Como convertimos 180.000 eventos sinteticos en un reporte util y reproducible?', 2.58, 5.28, 9.48, 0.46, {
    fontSize: 18, bold: true, color: C.forest,
  });
  addNotes(slide, 'Presentar la pregunta que organiza el proyecto. La respuesta no es solo el reporte: se demuestra un flujo reproducible desde un productor local hasta un modelo semantico.');
}

function slideScale() {
  const slide = baseSlide('02 · Simulacion', 'Una huerta sintetica, con escala y tiempo', 'El productor publica telemetria historica una sola vez y luego mantiene un flujo de eventos actuales.', 3);
  addKpi(slide, 0.72, 2.0, 2.82, 1.62, '180', 'dias historicos', C.blue, 'Hasta ayer UTC');
  addKpi(slide, 3.76, 2.0, 2.82, 1.62, '1.000', 'eventos por dia', C.teal, 'Distribuidos en 24 horas');
  addKpi(slide, 6.8, 2.0, 2.82, 1.62, '180.000', 'mensajes iniciales', C.orange, 'Backfill ya verificado');
  addKpi(slide, 9.84, 2.0, 2.82, 1.62, '4 / 5 s', 'sensores / ciclo', C.green, 'Telemetria en vivo');

  card(slide, 0.72, 4.0, 7.1, 1.62, { accent: C.red });
  txt(slide, 'Evento de calidad intencional', 1.02, 4.26, 5.9, 0.34, { fontSize: 17, bold: true });
  txt(slide, 'Cada 20 eventos se genera una humedad de suelo de 125% para probar la cuarentena.', 1.02, 4.76, 6.24, 0.5, { fontSize: 13, color: C.muted, valign: 'top' });
  const barX = 8.3;
  const barY = 4.47;
  rect(slide, barX, barY, 3.9, 0.32, C.green, true, C.green);
  rect(slide, barX + 3.705, barY, 0.195, 0.32, C.red, true, C.red);
  txt(slide, '95% dentro de regla', barX, 4.93, 2.7, 0.28, { fontSize: 11, bold: true, color: C.green });
  txt(slide, '5% cuarentena', barX + 2.65, 4.93, 1.55, 0.28, { fontSize: 11, bold: true, color: C.red, align: 'right' });
  txt(slide, 'Esperado por configuracion; no representa una recomendacion agronomica.', 8.3, 5.4, 3.9, 0.42, { fontSize: 9, color: C.muted, valign: 'top' });
  addNotes(slide, 'Explicar los 180 dias x 1000 registros. El marcador persistente impide reenviar el historico en cada reinicio. El flujo en vivo continua despues del backfill. La barra 95/5 refleja el patron sintetico de una anomalia cada 20 eventos, no una medicion real.');
}

function slideArchitecture() {
  const slide = baseSlide('03 · Arquitectura', 'Un flujo continuo; transformacion orquestada', 'La ingestion es streaming. La preparacion medallion se ejecuta como trabajo Spark desde un pipeline.', 4);
  const y = 2.3;
  const nodeW = 2.15;
  const nodeH = 1.15;
  const nodes = [
    { x: 0.66, color: C.blue, head: 'Docker', sub: 'Productor Python\n4 sensores virtuales' },
    { x: 3.22, color: C.teal, head: 'Eventstream', sub: 'Custom endpoint\nKafka + SASL_SSL' },
    { x: 5.78, color: C.green, head: 'Lakehouse', sub: 'Bronze\ntelemetry_bronze_raw' },
    { x: 8.34, color: C.orange, head: 'Notebook Spark', sub: 'Silver · cuarentena\nGold · dim_fecha' },
    { x: 10.9, color: C.purple, head: 'Power BI', sub: 'Modelo semantico\nReporte Gold' },
  ];
  nodes.forEach((node) => {
    card(slide, node.x, y, nodeW, nodeH, { accent: node.color });
    txt(slide, node.head, node.x + 0.2, y + 0.21, nodeW - 0.35, 0.3, { fontSize: 15, bold: true, color: node.color });
    txt(slide, node.sub, node.x + 0.2, y + 0.61, nodeW - 0.35, 0.4, { fontSize: 10, color: C.muted, valign: 'top' });
  });
  for (let i = 0; i < nodes.length - 1; i++) {
    rule(slide, nodes[i].x + nodeW + 0.03, y + 0.57, nodes[i + 1].x - 0.08, y + 0.57, C.muted, 1.6, 'solid', true);
  }

  card(slide, 6.2, 4.32, 2.3, 0.88, { fill: C.mint, accent: C.teal });
  txt(slide, 'Pipeline Fabric', 6.45, 4.48, 1.9, 0.25, { fontSize: 13, bold: true, color: C.forest });
  txt(slide, 'orquesta el notebook', 6.45, 4.78, 1.9, 0.2, { fontSize: 9, color: C.muted });
  rule(slide, 7.35, 4.3, 9.35, 3.52, C.teal, 1.2, 'dash', true);

  txt(slide, 'DATOS', 0.78, 1.89, 1.1, 0.2, { fontSize: 8, color: C.blue, bold: true, charSpacing: 1.2 });
  txt(slide, 'PLATAFORMA FABRIC', 3.36, 1.89, 4.1, 0.2, { fontSize: 8, color: C.teal, bold: true, charSpacing: 1.2 });
  txt(slide, 'ANALITICA', 10.98, 1.89, 1.2, 0.2, { fontSize: 8, color: C.purple, bold: true, charSpacing: 1.2 });

  rect(slide, 0.72, 5.8, 11.9, 0.58, C.white, true, C.line);
  txt(slide, 'Sin API HTTP ni ngrok', 1.0, 5.98, 2.35, 0.2, { fontSize: 11, bold: true, color: C.forest });
  txt(slide, 'El contenedor abre una conexion saliente al endpoint Kafka administrado por Fabric.', 3.1, 5.98, 8.95, 0.2, { fontSize: 11, color: C.muted });
  addNotes(slide, 'Recorrer de izquierda a derecha. Aclarar que Eventstream recibe directamente Kafka y escribe Bronze. El pipeline no copia esos mismos datos; ejecuta el notebook de procesamiento. Gold y la dimension calendario alimentan el modelo semantico.');
}

function slideProducer() {
  const slide = baseSlide('04 · Productor', 'Docker concentra la simulacion y el acceso Kafka', 'Configuracion por variables de entorno; la connection string nunca se incluye en la imagen ni en Git.', 5);
  addImagePanel(slide, '05-docker-logs.png', 0.7, 2.0, 6.1, 3.75, 'Ejecucion real: backfill persistido y ciclos en vivo', C.blue);
  card(slide, 7.2, 2.0, 5.4, 2.0, { accent: C.teal });
  txt(slide, 'Contrato SASL del productor', 7.5, 2.27, 4.7, 0.3, { fontSize: 17, bold: true });
  const config = [
    ['Protocolo', 'SASL_SSL'],
    ['Mecanismo', 'PLAIN'],
    ['Usuario', '$ConnectionString'],
    ['Secreto', 'KAFKA_CONNECTION_STRING en .env'],
  ];
  config.forEach((row, i) => {
    const yy = 2.78 + i * 0.29;
    txt(slide, row[0], 7.52, yy, 1.2, 0.2, { fontSize: 10, color: C.muted });
    txt(slide, row[1], 8.82, yy, 3.3, 0.2, { fontSize: 10, bold: true, color: C.ink });
  });
  card(slide, 7.2, 4.28, 5.4, 1.47, { fill: C.mint, accent: C.green });
  txt(slide, 'Backfill de una sola vez', 7.5, 4.52, 4.65, 0.3, { fontSize: 15, bold: true, color: C.forest });
  txt(slide, 'El volumen simulator-state guarda el marcador. Reiniciar no duplica el historico.', 7.5, 4.98, 4.65, 0.48, { fontSize: 11, color: C.muted, valign: 'top' });
  txt(slide, 'Nunca mostrar la connection string en capturas, logs compartidos o commits.', 0.75, 6.16, 11.6, 0.27, { fontSize: 10, color: C.red, bold: true });
  addNotes(slide, 'Describir la separacion entre imagen reproducible y secreto de ejecucion. El usuario obtiene bootstrap, topic y connection string desde el panel SAS Key Authentication en Fabric, y completa .env local. El marcador se conserva en un volumen nombrado.');
}

function slideFabric() {
  const slide = baseSlide('05 · Ingestion', 'Eventstream recibe; Lakehouse conserva Bronze', 'Configuracion manual desde Fabric: Custom endpoint, protocolo Kafka y destino Lakehouse.', 6);
  addImagePanel(slide, '01-workspace-eventstream.png', 0.65, 1.98, 7.55, 4.5, 'Eventstream publicado con destino Lakehouse y preview de eventos', C.teal);
  card(slide, 8.58, 2.0, 4.0, 1.05, { accent: C.blue });
  txt(slide, '01  Fuente', 8.86, 2.22, 3.3, 0.27, { fontSize: 15, bold: true, color: C.blue });
  txt(slide, 'dockerHuertaSource · Kafka', 8.86, 2.59, 3.25, 0.21, { fontSize: 10, color: C.muted });
  card(slide, 8.58, 3.28, 4.0, 1.05, { accent: C.green });
  txt(slide, '02  Destino', 8.86, 3.5, 3.3, 0.27, { fontSize: 15, bold: true, color: C.green });
  txt(slide, 'lakehouseHuerta · JSON', 8.86, 3.87, 3.25, 0.21, { fontSize: 10, color: C.muted });
  card(slide, 8.58, 4.56, 4.0, 1.05, { accent: C.orange });
  txt(slide, '03  Bronze', 8.86, 4.78, 3.3, 0.27, { fontSize: 15, bold: true, color: C.orange });
  txt(slide, 'datosCrudos.telemetry_bronze_raw', 8.86, 5.15, 3.25, 0.24, { fontSize: 9, color: C.muted });
  addNotes(slide, 'Mostrar la captura del canvas como evidencia del flujo real. El Eventstream se publica antes de copiar las credenciales SAS. El destino escribe JSON directamente en Bronze y sirve como punto de reprocesamiento.');
}

function slideMedallion() {
  const slide = baseSlide('06 · Transformacion', 'Medallion convierte telemetria en datos confiables', 'El notebook procesa la tabla de aterrizaje y deja productos separados para analisis y auditoria.', 7);
  const columns = [
    { x: 0.68, color: C.orange, fill: 'FFF0E4', label: 'BRONZE', table: 'telemetry_bronze_raw', lines: ['JSON original', 'Registro de llegada', 'Base para reproceso'] },
    { x: 4.92, color: C.teal, fill: 'E6F5F1', label: 'SILVER', table: 'telemetry_silver', lines: ['Tipos normalizados', 'Validacion de rangos', 'Deduplicacion por event_id'] },
    { x: 9.16, color: C.blue, fill: 'EAF3FC', label: 'GOLD', table: 'telemetry_gold_daily', lines: ['Agregacion por fecha', 'Parcela y cultivo', 'Indicadores para Power BI'] },
  ];
  columns.forEach((item) => {
    card(slide, item.x, 2.25, 3.48, 3.15, { fill: item.fill, line: item.fill, accent: item.color });
    txt(slide, item.label, item.x + 0.25, 2.52, 2.8, 0.25, { fontSize: 10, bold: true, color: item.color, charSpacing: 1.5 });
    txt(slide, item.table, item.x + 0.25, 2.95, 2.92, 0.45, { fontSize: 15, bold: true, color: C.ink });
    item.lines.forEach((lineText, index) => {
      const yy = 3.68 + index * 0.48;
      rect(slide, item.x + 0.27, yy + 0.06, 0.11, 0.11, item.color, true);
      txt(slide, lineText, item.x + 0.5, yy, 2.7, 0.24, { fontSize: 11, color: C.muted });
    });
  });
  rule(slide, 4.2, 3.85, 4.78, 3.85, C.muted, 1.5, 'solid', true);
  rule(slide, 8.45, 3.85, 9.0, 3.85, C.muted, 1.5, 'solid', true);
  card(slide, 1.12, 5.82, 11.0, 0.64, { fill: C.white, line: C.line });
  txt(slide, 'Reglas de calidad', 1.38, 6.02, 1.7, 0.2, { fontSize: 10, bold: true, color: C.forest });
  txt(slide, 'Temperatura −10..60 °C  ·  Humedad 0..100%  ·  pH 0..14  ·  Bateria 0..100%', 3.0, 6.02, 8.7, 0.2, { fontSize: 10, color: C.muted });
  addNotes(slide, 'Bronze mantiene la entrada. Silver convierte tipos, aplica reglas didacticas y deduplica. Los rechazados se guardan en quarantine, separado de Silver. Gold agrupa por fecha, parcela y cultivo. Aclarar que humedad baja <30 es un umbral para demostrar calidad, no consejo agronomico.');
}

function slidePipeline() {
  const slide = baseSlide('07 · Orquestacion', 'Notebook + pipeline: ejecucion repetible', 'Una actividad Notebook activa el procesamiento bajo demanda o mediante una programacion en Fabric.', 8);
  addImagePanel(slide, '07-notebook-medallion.png', 0.68, 2.02, 6.0, 3.72, 'Notebook PySpark ejecutado sobre el Lakehouse', C.teal);
  addImagePanel(slide, '08-pipeline-success.png', 6.95, 2.02, 5.7, 3.72, 'Pipeline con actividad Notebook en estado exitoso', C.blue);
  rect(slide, 0.72, 6.03, 11.9, 0.52, C.mint, true, C.mint);
  txt(slide, 'Un pipeline, una actividad Notebook, cuatro salidas: Silver · cuarentena · Gold · calendario.', 1.0, 6.18, 11.2, 0.2, { fontSize: 12, bold: true, color: C.forest, align: 'center' });
  addNotes(slide, 'La captura del notebook documenta los resultados de la ejecucion inicial; la captura del pipeline confirma que la actividad Notebook termino correctamente. En capacidad Trial, si aparece HTTP 430, revisar Monitoring y evitar ejecuciones repetidas.');
}

function slideModel() {
  const slide = baseSlide('08 · Modelo', 'La dimension calendario desbloquea el analisis mensual', 'Gold y dim_fecha se relacionan en el modelo semantico Direct Lake on SQL.', 9);
  addImagePanel(slide, '09-gold-and-calendar.png', 0.65, 2.0, 6.0, 3.75, 'Gold diario y calendario fisico en el Lakehouse', C.orange);
  addImagePanel(slide, '10-semantic-model.png', 6.88, 2.0, 5.8, 3.75, 'Relacion de fecha hacia la tabla Gold', C.purple);
  card(slide, 0.78, 5.98, 11.7, 0.64, { fill: C.white, line: C.line });
  txt(slide, 'dim_fecha[date]', 1.12, 6.18, 2.4, 0.2, { fontSize: 12, bold: true, color: C.teal });
  txt(slide, '1', 4.17, 6.16, 0.3, 0.22, { fontSize: 12, bold: true, color: C.muted, align: 'center' });
  rule(slide, 4.55, 6.27, 8.22, 6.27, C.teal, 1.6, 'solid', true);
  txt(slide, '*', 8.46, 6.16, 0.3, 0.22, { fontSize: 14, bold: true, color: C.muted, align: 'center' });
  txt(slide, 'telemetry_gold_daily[event_date]', 8.9, 6.18, 3.2, 0.2, { fontSize: 11, bold: true, color: C.blue });
  addNotes(slide, 'La dimension calendario es fisica porque el modelo es Direct Lake on SQL, que no permite tablas calculadas DAX que dependan de Direct Lake. Month_name se ordena por month_number. Mostrar la relacion 1 a muchos.');
}

function slideReport() {
  const slide = baseSlide('09 · Consumo', 'Power BI muestra patrones por fecha, parcela y cultivo', 'El reporte usa medidas ponderadas para resumir Gold sin sesgo por distinto volumen de lecturas.', 10);
  addImagePanel(slide, '11-power-bi-report.png', 0.68, 1.95, 8.4, 4.75, 'Reporte real construido sobre sm_huerta_gold', C.blue);
  card(slide, 9.42, 2.15, 3.12, 1.03, { accent: C.blue });
  txt(slide, 'ESTADO DIARIO', 9.68, 2.39, 2.55, 0.22, { fontSize: 10, bold: true, color: C.blue, charSpacing: 1.1 });
  txt(slide, 'Humedad · lecturas · parcela', 9.68, 2.7, 2.55, 0.26, { fontSize: 10, color: C.muted });
  card(slide, 9.42, 3.43, 3.12, 1.03, { accent: C.teal });
  txt(slide, 'TENDENCIAS', 9.68, 3.67, 2.55, 0.22, { fontSize: 10, bold: true, color: C.teal, charSpacing: 1.1 });
  txt(slide, 'Fecha · cultivo · comparacion', 9.68, 3.98, 2.55, 0.26, { fontSize: 10, color: C.muted });
  card(slide, 9.42, 4.71, 3.12, 1.03, { accent: C.orange });
  txt(slide, 'FILTRO MENSUAL', 9.68, 4.95, 2.55, 0.22, { fontSize: 10, bold: true, color: C.orange, charSpacing: 1.1 });
  txt(slide, 'Ano > Mes, compartido entre paginas', 9.68, 5.26, 2.55, 0.28, { fontSize: 9, color: C.muted });
  addNotes(slide, 'Recorrer primero la pagina de estado, luego tendencias. Explicar que el segmentador usa dim_fecha, el filtro se sincroniza y los meses se ordenan por month_number. Los valores son sinteticos.');
}

function slideEngineering() {
  const slide = baseSlide('10 · Decisiones tecnicas', 'Reproducible, seguro y honesto sobre sus limites', 'El diseno separa secretos, estado local, ingesta continua y computo Spark.', 11);
  const rows = [
    { color: C.green, title: 'Reproducibilidad', body: 'Docker Compose fija runtime, dependencia y variables; el volumen conserva el marcador del backfill.' },
    { color: C.blue, title: 'Seguridad', body: 'SAS vive en .env local. No se sube, ni se incluye en imagenes, PPT o Git.' },
    { color: C.orange, title: 'Calidad', body: 'IDs deterministas, deduplicacion y cuarentena hacen visible el tratamiento de anomalías.' },
    { color: C.purple, title: 'Capacidad', body: 'Eventstream ingiere; Spark requiere capacidad libre. El error 430 se gestiona desde Monitoring.' },
  ];
  rows.forEach((item, index) => {
    const y = 1.98 + index * 0.96;
    card(slide, 0.72, y, 7.35, 0.76, { accent: item.color });
    txt(slide, item.title, 1.02, y + 0.12, 1.6, 0.24, { fontSize: 13, bold: true, color: item.color });
    txt(slide, item.body, 2.72, y + 0.1, 5.0, 0.46, { fontSize: 10, color: C.muted, valign: 'mid' });
  });
  card(slide, 8.52, 2.05, 4.0, 3.55, { fill: C.forest, line: C.forest });
  txt(slide, 'LO QUE NO AFIRMA', 8.88, 2.42, 3.3, 0.25, { fontSize: 10, color: 'B9DDC5', bold: true, charSpacing: 1.2 });
  txt(slide, 'No es un sistema IoT de produccion.\n\nNo es una API HTTP local.\n\nNo entrega recomendaciones agronomicas.', 8.88, 2.98, 3.15, 1.9, { fontSize: 16, color: C.white, bold: true, valign: 'top' });
  txt(slide, 'Es una demostracion academica del flujo de datos.', 8.88, 5.0, 3.1, 0.32, { fontSize: 10, color: 'B9DDC5' });
  addNotes(slide, 'Destacar los limites como decisiones responsables. El simulador no se conecta a sensores fisicos. Las mediciones, cultivos y umbrales son sinteticos; se valida arquitectura y analitica, no agronomia real.');
}

function slideClose() {
  const slide = pptx.addSlide();
  slide.background = { color: C.forest };
  rect(slide, 0, 0, W, H, C.forest);
  rect(slide, 8.7, 0, 4.7, H, C.forest2, false, C.forest2);
  addFabricMark(slide, 0.72, 0.55, 1.1, true);
  txt(slide, 'CIERRE', 0.8, 1.53, 2.0, 0.28, { fontSize: 10, color: 'B8D9C1', bold: true, charSpacing: 2 });
  txt(slide, 'De datos\nsinteticos a\ndecisiones visibles.', 0.75, 2.05, 6.8, 2.7, {
    fontFace: 'Aptos Display', fontSize: 35, color: C.white, bold: true,
  });
  txt(slide, 'Docker → Eventstream → Lakehouse → Medallion → Power BI', 0.82, 5.13, 6.6, 0.42, { fontSize: 14, color: 'D5E9DB', bold: true });
  txt(slide, 'Preguntas', 0.82, 6.26, 2.5, 0.52, { fontSize: 26, bold: true, color: C.yellow });
  leafMotif(slide, 10.1, 2.0, 1.55, true);
  txt(slide, 'Gracias', 10.06, 5.5, 2.6, 0.38, { fontSize: 17, color: C.white, bold: true, align: 'center' });
  addNotes(slide, 'Cierre sugerido: la aportacion es conectar todos los pasos y hacer visibles calidad, trazabilidad y limitaciones. Invitar preguntas sobre Kafka, medallion, Direct Lake o Power BI.');
}

slideCover();
slideStory();
slideScale();
slideArchitecture();
slideProducer();
slideFabric();
slideMedallion();
slidePipeline();
slideModel();
slideReport();
slideEngineering();
slideClose();

async function main() {
  await pptx.writeFile({ fileName: outputPath });
  console.log(`Presentacion creada: ${outputPath}`);
  console.log(`Diapositivas: ${pptx._slides.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});