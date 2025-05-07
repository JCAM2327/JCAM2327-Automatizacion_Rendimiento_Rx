#   Automatización de Rendimiento en Síntesis Químicas
Aplicación interactiva en Streamlit para calcular y visualizar el rendimiento de síntesis químicas a partir de archivos Excel o CSV. Desarrollada con Python, pandas, matplotlib y Streamlit, orientada a uso académico y de laboratorio.

## Características
- Carga archivos `.xlsx` o `.csv`
- Selección de columnas reales y teóricas
- Cálculo de rendimiento (%) por fila
- Visualización gráfica con promedio y márgenes de tolerancia (+/-5%)
- Estadísticas descriptivas
- Descarga del Excel con datos y resumen

## Tecnologías utilizadas
- Python
- pandas
- matplotlib
- Streamlit

En el repositorio se tiene ejemplos descargables de la estruturas de los archivos, siendo el archivo a cargar "datos_reactivos.xlsx" y el que se descargará "resultados_rendimiento.xlsx"

## Cómo ejecutar
```bash
pip install -r requirements.txt
streamlit run app.py
