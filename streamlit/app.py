import pandas as pd
import streamlit as st
import matplotlib.pyplot as plt
from io import BytesIO

# Configuración de la página de Streamlit
st.set_page_config(page_title="Análisis de Rendimiento Químico", layout="centered")
st.title("📊 Análisis de Rendimiento en Síntesis Químicas")

# Carga de archivo por parte del usuario (Excel o CSV)
uploaded_file = st.file_uploader("Sube un archivo Excel o CSV", type=["xlsx", "csv"])

if uploaded_file:
    try:
        # Leer archivo según su extensión
        if uploaded_file.name.endswith(".csv"):
            df = pd.read_csv(uploaded_file)
        else:
            df = pd.read_excel(uploaded_file)

        # Mostrar vista previa de los datos cargados
        st.subheader("Vista previa de los datos cargados")
        st.dataframe(df.head())

        # Selección de columnas para el cálculo
        columnas = df.columns.tolist()
        col_real = st.selectbox("Selecciona la columna de Producto Real (g):", columnas)
        col_teorico = st.selectbox("Selecciona la columna de Producto Teórico (g):", columnas)

        # Botón para calcular el rendimiento
        if st.button("Calcular Rendimiento"):
            # Validación de datos: nulos y valores negativos/cero
            if df[col_real].isnull().any() or df[col_teorico].isnull().any():
                st.error("Existen valores nulos en las columnas seleccionadas.")
            elif (df[col_real] < 0).any() or (df[col_teorico] <= 0).any():
                st.error("Existen valores negativos o ceros en las columnas seleccionadas.")
            else:
                # Cálculo del rendimiento y creación de nueva columna
                df["Rendimiento (%)"] = (df[col_real] / df[col_teorico]) * 100

                # Mostrar estadísticas descriptivas del rendimiento
                st.subheader("📈 Estadísticas del Rendimiento")
                st.write(df["Rendimiento (%)"].describe())

                # Gráfico de barras del rendimiento por fila
                st.subheader("📊 Gráfico de Rendimiento por Fila")
                fig, ax = plt.subplots(figsize=(8, 4))
                barras = ax.bar(df.index + 1, df["Rendimiento (%)"], color='skyblue')

                # Líneas de referencia: promedio y ±5%
                promedio = df["Rendimiento (%)"].mean()
                ax.axhline(promedio, color='green', linestyle='--', label=f'Promedio: {promedio:.2f}%')
                ax.axhline(promedio * 1.05, color='red', linestyle=':', label='+5%')
                ax.axhline(promedio * 0.95, color='red', linestyle=':', label='-5%')
                ax.set_xlabel("Fila (Síntesis)")
                ax.set_ylabel("Rendimiento (%)")
                ax.set_title("Rendimiento por Fila")
                ax.grid(axis='y', linestyle='--', alpha=0.7)
                ax.legend()

                # Mostrar valor encima de cada barra
                for bar in barras:
                    yval = bar.get_height()
                    ax.text(bar.get_x() + bar.get_width()/2, yval + 1, f"{yval:.1f}", ha='center', va='bottom', fontsize=8)

                # Mostrar el gráfico en la app
                st.pyplot(fig)

                # Sección para descargar los resultados
                st.subheader("📥 Descargar resultados")

                # Guardar los resultados y el resumen en un archivo Excel en memoria
                output = BytesIO()
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    df.to_excel(writer, index=False, sheet_name="Datos")
                    df.describe().to_excel(writer, sheet_name="Resumen")
                output.seek(0)  # Reiniciar el puntero del archivo en memoria

                # Botón de descarga del archivo Excel
                st.download_button(
                    label="Descargar Excel con Rendimiento",
                    data=output.getvalue(),
                    file_name="resultados_rendimiento.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )

    except Exception as e:
        # Mostrar error si ocurre algún problema en el procesamiento
        st.error(f"Error al procesar el archivo: {e}")
