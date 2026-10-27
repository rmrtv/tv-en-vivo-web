TV EN VIVO — INSTRUCCIONES

ARCHIVOS
- index.html: estructura de la página.
- estilos.css: diseño visual.
- app.js: reproductor y control remoto.
- canales.json: lista editable con nombres, logos y enlaces de transmisión.

CÓMO AGREGAR CANALES
Abrí canales.json con el Bloc de notas y reemplazá el ejemplo por datos reales:
{
  "canales": [
    {
      "nombre": "Nombre del canal",
      "logo": "https://servidor.com/logo.webp",
      "url": "https://servidor.com/canal/playlist.m3u8"
    },
    {
      "nombre": "Otro canal",
      "logo": "https://servidor.com/otro-logo.webp",
      "url": "https://servidor.com/otro-canal/playlist.m3u8"
    }
  ]
}

Importante:
- Cada canal necesita nombre, URL de logo y URL de transmisión.
- Usá URLs directas y válidas. El enlace del logo debe apuntar a una imagen WEBP accesible.
- Los enlaces .m3u8 deben ser transmisiones a las que tengas derecho de acceso o distribución.
- La página no aloja ni crea las transmisiones; solo las reproduce.
- Algunos servidores bloquean la reproducción desde páginas web por CORS, tokens, geobloqueo o restricciones de acceso.
- Muchos navegadores no permiten cargar archivos locales JSON con fetch. Probá la web desde un servidor HTTP/HTTPS (por ejemplo, un hosting estático).
- HLS.js se carga desde un CDN, por lo que para esa biblioteca se necesita conexión a internet.
- El soporte para HLS depende del navegador y del dispositivo. En Android TV/Google TV, probá el navegador concreto o empaquetá la web en una app Android con reproductor compatible si fuera necesario.
- Este proyecto no incluye canales reales ni enlaces de terceros.

TECLAS / CONTROL REMOTO
- Flechas: moverse por la lista.
- OK / Enter: seleccionar canal.
- Escape / Backspace: salir de pantalla completa o pausar según el dispositivo.
- Botón en pantalla: activar pantalla completa.

Para usarlo en un sitio público, subí los cuatro archivos junto a README.txt a un hosting web y abrí index.html desde la dirección de ese sitio.
