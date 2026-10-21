# Reportes de la huerta en Microsoft Fabric

Esta guia define un reporte de Power BI/Fabric de dos paginas basado en el modelo semantico `sm_huerta_gold`, la tabla de hechos `telemetry_gold_daily` y la dimension calendario `dim_fecha`. Los nombres de campos del modelo permanecen en ingles, salvo las etiquetas de calendario; las medidas y etiquetas del reporte se presentan en espanol.

## Preparar el modelo

Entra a editar `sm_huerta_gold` y crea estas medidas desde **New measure**. Los promedios de Gold ya estan agregados por fecha, parcela y cultivo. Por eso, para obtener un promedio global correcto, se ponderan por `reading_count`.

```DAX
Lecturas =
SUM('telemetry_gold_daily'[reading_count])
```

```DAX
Lecturas humedad baja =
SUM('telemetry_gold_daily'[low_moisture_readings])
```

```DAX
Humedad suelo promedio =
DIVIDE(
    SUMX(
        'telemetry_gold_daily',
        'telemetry_gold_daily'[avg_soil_moisture_pct]
            * 'telemetry_gold_daily'[reading_count]
    ),
    [Lecturas]
)
```

```DAX
Temperatura promedio =
DIVIDE(
    SUMX(
        'telemetry_gold_daily',
        'telemetry_gold_daily'[avg_temperature_c]
            * 'telemetry_gold_daily'[reading_count]
    ),
    [Lecturas]
)
```

```DAX
Humedad relativa promedio =
DIVIDE(
    SUMX(
        'telemetry_gold_daily',
        'telemetry_gold_daily'[avg_relative_humidity_pct]
            * 'telemetry_gold_daily'[reading_count]
    ),
    [Lecturas]
)
```

```DAX
Porcentaje lecturas humedad baja =
DIVIDE([Lecturas humedad baja], [Lecturas], 0)
```

Configura `Humedad suelo promedio` y `Humedad relativa promedio` con 1 decimal; `Temperatura promedio` con 1 decimal; y `Porcentaje lecturas humedad baja` como porcentaje con 1 decimal. Estas medidas usan los umbrales didacticos definidos para la practica, no son recomendaciones agronomicas.

## Pagina 1: Estado de la huerta

Nombre sugerido de pagina: `Estado diario`.

### Indicadores

Agrega cuatro visuales **Card** en la franja superior:

| Etiqueta | Campo o medida |
|---|---|
| Lecturas | `[Lecturas]` |
| Humedad del suelo | `[Humedad suelo promedio]` |
| Temperatura promedio | `[Temperatura promedio]` |
| Lecturas con humedad baja | `[Porcentaje lecturas humedad baja]` |

### Humedad por parcela

Usa **Clustered column chart** (columnas agrupadas, no apiladas al 100%). En los campos del visual coloca:

- **X-axis:** `plot_id`
- **Y-axis:** `[Humedad suelo promedio]`
- **Legend:** `crop`

En formato, activa el titulo `Humedad promedio del suelo por parcela`, y nombra los ejes `Parcela` y `Humedad promedio (%)`. Si usas un grafico de barras horizontal en su lugar, coloca `plot_id` en **Y-axis** y la medida en **X-axis**.

### Alertas didacticas por parcela

Usa **Clustered bar chart** horizontal:

- **Y-axis:** `plot_id`
- **X-axis:** `[Lecturas humedad baja]`
- Titulo: `Lecturas con humedad baja por parcela`

### Detalle

Agrega un visual **Table** con `dim_fecha[date]`, `plot_id`, `crop`, `[Lecturas]`, `[Humedad suelo promedio]`, `[Temperatura promedio]`, `[Humedad relativa promedio]`, `avg_soil_ph` y `[Lecturas humedad baja]`. Cambia la etiqueta de los campos del visual a espanol donde sea necesario.

## Pagina 2: Tendencia y comparacion

Agrega una segunda pagina y nombrala `Tendencias`.

### Evolucion de humedad

Usa **Line chart**:

- **X-axis:** `dim_fecha[date]`, tipo continuo y orden ascendente
- **Y-axis:** `[Humedad suelo promedio]`
- **Legend:** `plot_id`
- Titulo: `Humedad del suelo por parcela y fecha`

El backfill predeterminado genera hasta 180 dias de historial, asi que el grafico permite observar la evolucion por parcela. Si configuraste menos dias o acabas de iniciar el proyecto, mostrara solo el rango disponible.

### Volumen de lecturas

Usa **Stacked column chart**:

- **X-axis:** `dim_fecha[date]`
- **Y-axis:** `[Lecturas]`
- **Legend:** `crop`
- Titulo: `Lecturas por fecha y cultivo`

### Comparacion en matriz

Usa **Matrix**:

- **Rows:** `plot_id`, despues `crop`
- **Columns:** `dim_fecha[year_month]` o `dim_fecha[month_name]` con `dim_fecha[year]`
- **Values:** `[Humedad suelo promedio]`, `[Lecturas]` y `[Lecturas humedad baja]`

Aplica formato condicional de color a la humedad para facilitar la comparacion entre parcelas.

### Filtros

Agrega segmentadores para `dim_fecha[year]`, `dim_fecha[month_name]`, `plot_id` y `crop`. Colocalos en una franja superior o lateral y verifica que filtren los visuales de la pagina.

Para agregar un filtro mensual:

1. En el panel **Data**, abre `dim_fecha` y arrastra `year`, `month_name` y, opcionalmente, `date` al segmentador en ese orden. Esto forma la jerarquia **Ano > Mes > Fecha**.
2. En el modelo, selecciona `dim_fecha[month_name]` y ordenala por `dim_fecha[month_number]` con **Sort by column** para que aparezca enero, febrero, marzo y no por orden alfabetico.
3. Con el segmentador seleccionado, abre **Format visual** (icono de brocha) > **Visual** > **Slicer settings** > **Options** > **Style** y elige **Dropdown**.
4. Abre el desplegable, expande el ano y selecciona el mes.
5. En **View > Sync slicers**, sincroniza este segmentador en las paginas `Estado diario` y `Tendencias` si quieres que el mismo mes filtre ambas.

La columna `dim_fecha[date]` se relaciona con `telemetry_gold_daily[event_date]` mediante una relacion activa uno a varios. Si la jerarquia no filtra los visuales Gold, revisa esa relacion.

## Guardar y revisar

1. Guarda el reporte como `Reporte_huerta_gold` en el workspace del proyecto.
2. Comprueba que utiliza las medidas y campos de `telemetry_gold_daily` y la dimension `dim_fecha` para el filtro de fechas.
3. Comprueba que las medidas se agregan como medidas, no como **Sum of avg_soil_moisture_pct** ni **Sum of avg_temperature_c**.
4. Para la demostracion, filtra por parcela y cultivo, compara el conteo de humedad baja y muestra como el reporte usa exclusivamente la capa Gold.