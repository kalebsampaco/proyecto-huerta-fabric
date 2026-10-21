# Generador de la presentacion

Genera `docs/Presentacion_Huerta_Fabric.pptx` a partir de `generate.cjs` y de las capturas en `docs/images/`.

```powershell
npm.cmd install
npm.cmd run build
```

Las diapositivas usan formas y barras editables de PowerPoint, incorporan capturas del proyecto y contienen notas del expositor. No agregues connection strings, claves ni `.env` a la presentacion.