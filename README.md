# Automatización de rendimiento en reacciones

Aplicación web para calcular y visualizar el rendimiento de síntesis químicas a partir de archivos Excel o CSV. Los datos se procesan en el navegador y no se envían a un servidor.

## Estado

MVP con demo pública en Vercel: <https://rendimientoquimico.vercel.app>. La versión anterior en Streamlit se conserva en `streamlit/` como referencia.

## Características

- Carga de archivos `.xlsx`, `.xls` o `.csv` (máximo 10 MB).
- Guía integrada con los requisitos del archivo, la explicación del cálculo y la lectura de resultados.
- Vista previa de las primeras filas del archivo.
- Detección automática de columnas por encabezado y selección manual de las columnas de producto real y teórico.
- Validación de valores nulos, negativos y ceros.
- Cálculo del rendimiento porcentual por fila.
- Estadísticas descriptivas: promedio, mediana, desvío estándar, mínimo, máximo y cuartiles.
- Gráfico de barras por fila con promedio y margen de tolerancia de ±5%.
- Resumen interpretativo automático con conclusión, dispersión y advertencias.
- Descarga de un Excel con los datos procesados y un resumen estadístico.
- Procesamiento en memoria, sin base de datos ni persistencia.

## Cómo funciona

1. El usuario sube un archivo Excel o CSV.
2. La app muestra una vista previa de las primeras filas.
3. Se eligen las columnas que representan el producto real y el producto teórico.
4. Al calcular, se valida que no haya valores nulos, que el producto real no sea negativo y que el producto teórico sea mayor que cero.
5. Se calcula el rendimiento de cada fila con la fórmula `(producto real / producto teórico) × 100`.
6. Se muestran estadísticas, un gráfico por fila y un botón para descargar los resultados en Excel.

La herramienta es una ayuda de cálculo. No reemplaza la validación experimental, los procedimientos de laboratorio ni la revisión de unidades por parte de la persona usuaria.

## Tecnologías

- Next.js 15 (App Router)
- React 19
- TypeScript
- `xlsx` para lectura y escritura de planillas
- CSS propio

## Estructura

```text
.
├── src/
│   ├── app/                 # layout, página y estilos globales
│   ├── components/          # interfaz, gráfico y carga de archivos
│   └── lib/                 # cálculo de rendimiento y lectura/escritura de Excel
├── public/
│   └── datos_reactivos.xlsx # archivo de ejemplo descargable
├── streamlit/               # versión anterior en Python/Streamlit
├── package.json
└── README.md
```

## Ejecutar localmente

Requiere Node.js 18.18 o superior.

```bash
npm install
npm run dev
```

Abrí `http://localhost:3000`.

Verificaciones disponibles:

```bash
npm run typecheck
npm run build
```

## Formato de los datos

El archivo debe tener al menos dos columnas numéricas: una para el producto real y otra para el producto teórico.

- La primera fila debe contener los encabezados.
- El producto real puede ser cero, pero no negativo.
- El producto teórico debe ser mayor que cero.
- No se permiten valores nulos en las columnas seleccionadas.
- Ambas columnas deben estar en la misma unidad de masa; la interfaz las presenta en gramos (g).
- El archivo `datos_reactivos.xlsx` sirve como ejemplo de entrada.

## Privacidad y limitaciones

- No hay autenticación, base de datos ni almacenamiento persistente.
- Los archivos se procesan en el navegador y no se envían a un servidor.
- Los resultados se descargan manualmente en un archivo Excel.
- No se validan automáticamente las unidades ni la calidad experimental de los datos.
- No incluye tests automatizados.
- No debe usarse como sustituto de un sistema de gestión de laboratorio o de un proceso con requisitos de auditoría.

## Versión en Streamlit

La implementación anterior en Python está en [`streamlit/`](streamlit/README.md). Se conserva como referencia y no es la versión principal del proyecto.

## Enlaces

- [Demo en Vercel](https://rendimientoquimico.vercel.app)
- [Repositorio en GitHub](https://github.com/JCAM2327/JCAM2327-Automatizacion_Rendimiento_Rx)
- [Portfolio](https://jcam2327.github.io/portfolio/)
