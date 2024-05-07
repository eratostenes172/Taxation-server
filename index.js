// Importar las dependencias necesarias
const fs = require("fs");
const { chromium } = require('playwright');
const express = require("express");
const bodyParser = require("body-parser");

// Crear la aplicación Express
const app = express();

// Configurar bodyParser para convertir el cuerpo de las solicitudes a JSON
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(bodyParser.json({ limit: '100mb' }));

// Configurar cabeceras para permitir solicitudes CORS
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Función para cargar el contenido de un archivo CSS
function cargarCSS(filePath) {
  try {
    // Leer el contenido del archivo CSS
    const cssContent = fs.readFileSync(filePath, "utf8");
    return cssContent;
  } catch (error) {
    console.error("Error al cargar el archivo CSS:", error);
    return ""; // Retorna una cadena vacía en caso de error
  }
}

// Función para generar un PDF a partir de HTML
async function generarPdf(html, res) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Agregar referencia al contenido de los archivos CSS al HTML
  const bootstrapCSS = cargarCSS("assets/bootstrap.css");
  const styleCSS = cargarCSS("assets/style.css");
  html += `
    <style>
      ${bootstrapCSS}
      ${styleCSS}
    </style>
  `;

  await page.setContent(html);
  await page.pdf({ path: 'output.pdf' });
  await browser.close();
  res.download('output.pdf');
}

// Ruta para generar un PDF a partir de HTML
app.post('/generarPdf', function (req, res) {
  generarPdf(req.body.html, res)
    .then(() => {
      console.log('PDF generado correctamente.');
    })
    .catch((error) => {
      console.error('Error al generar el PDF:', error);
      res.status(500).send('Error al generar el PDF');
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});