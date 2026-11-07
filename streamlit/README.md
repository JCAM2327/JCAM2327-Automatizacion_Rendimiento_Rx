# Automatización de rendimiento en reacciones

Aplicación interactiva en Streamlit para calcular y visualizar el rendimiento de síntesis químicas a partir de archivos Excel o CSV. Está orientada a uso académico y de laboratorio.

## Estado

MVP. Al 2026-11-06 no hay una demo pública estable verificada: el despliegue de Vercel devuelve 404 y el enlace de Streamlit redirige a inicio de sesión. El código y los archivos de ejemplo están disponibles en el repositorio; para probar la app, ejecutala localmente.

## Características

- Carga de archivos `.xlsx` o `.csv`.
- Vista previa de los datos cargados.
- Selección de las columnas de producto real y producto teórico.
- Validación de valores nulos, negativos y ceros.
- Cálculo del rendimiento porcentual por fila.
- Estadísticas descriptivas del rendimiento.
- Gráfico de barras por fila con promedio y márgenes de tolerancia de ±5%.
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

- Python
- Streamlit
- pandas
- matplotlib
- openpyxl

## Estructura

```text
streamlit/
├── app.py
├── requirements.txt
├── datos_reactivos.xlsx
├── resultados_rendimiento.xlsx
└── README.md
```

- `app.py`: interfaz y lógica de cálculo.
- `requirements.txt`: dependencias de Python.
- `datos_reactivos.xlsx`: archivo de ejemplo para cargar.
- `resultados_rendimiento.xlsx`: ejemplo del archivo que genera la app.

## Ejecutar localmente

Requisitos: Python 3 y pip.

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
streamlit run app.py
```

Luego abrí la URL que muestra Streamlit en la terminal, normalmente `http://localhost:8501`.

## Formato de los datos

El archivo debe tener al menos dos columnas numéricas: una para el producto real y otra para el producto teórico.

- El producto real puede ser cero, pero no negativo.
- El producto teórico debe ser mayor que cero.
- No se permiten valores nulos en las columnas seleccionadas.
- Ambas columnas deben estar en la misma unidad de masa; la interfaz las presenta en gramos (g).
- El archivo `datos_reactivos.xlsx` sirve como ejemplo de entrada.

## Privacidad y limitaciones

- No hay autenticación, base de datos ni almacenamiento persistente.
- Los archivos se procesan durante la sesión de Streamlit.
- Los resultados se descargan manualmente en un archivo Excel.
- No se validan automáticamente las unidades ni la calidad experimental de los datos.
- No incluye tests automatizados.
- No debe usarse como sustituto de un sistema de gestión de laboratorio o de un proceso con requisitos de auditoría.

## Enlaces

- [Repositorio en GitHub](https://github.com/JCAM2327/JCAM2327-Automatizacion_Rendimiento_Rx)
- [Portfolio](https://jcam2327.github.io/portfolio/)
