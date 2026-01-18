# Creation des icones

Le fichier `icon.svg` est le design source pour les icones de l'application.

## Conversion en ICO (Windows)

### Option 1 : Outil en ligne
1. Allez sur [convertio.co](https://convertio.co/svg-ico/) ou [cloudconvert.com](https://cloudconvert.com/svg-to-ico)
2. Uploadez `icon.svg`
3. Selectionnez les tailles : 16x16, 32x32, 48x48, 256x256
4. Telechargez et renommez en `icon.ico`

### Option 2 : ImageMagick (ligne de commande)
```bash
# Installation via Chocolatey
choco install imagemagick

# Conversion
magick convert icon.svg -resize 256x256 icon.png
magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Option 3 : GIMP
1. Ouvrez `icon.svg` dans GIMP
2. Image > Echelle de l'image > 256x256
3. Fichier > Exporter sous > `icon.ico`
4. Selectionnez les tailles a inclure

## Conversion en ICNS (macOS)

```bash
# Avec iconutil (macOS uniquement)
mkdir icon.iconset
sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
iconutil -c icns icon.iconset
```

## Fichiers requis

- `icon.ico` - Windows (256x256 minimum, multi-resolution recommande)
- `icon.icns` - macOS
- `icon.png` - Linux (256x256 ou 512x512)

## Activation des icones

Une fois les fichiers crees, decommentez les lignes dans `electron-builder.yml` :

```yaml
win:
  icon: resources/icon.ico  # Decommenter

nsis:
  installerIcon: resources/icon.ico  # Decommenter
  uninstallerIcon: resources/icon.ico  # Decommenter
```
