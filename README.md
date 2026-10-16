# CareVix website

Static site (HTML, CSS, JavaScript). No build step, no dependencies.

## Pages
- `index.html`: home (interactive microscope hero, scroll-driven pathway)
- `solutions.html`: Wave and Loop, with a switcher and a day timeline
- `gyrostainer.html`: GyroStainer, with a protocol simulator and a microscope magnifier
- `about.html`: founders (photo placeholders) and partners
- `get-involved.html`: NGOs and investors, contact form (opens an email to info@carevix.ch)

## Structure
- `assets/css/style.css`: all styles; brand colours are at the top
- `assets/js/main.js`: all interactions
- `assets/img/`: logos and photos

## Publish on GitHub Pages
Settings → Pages → Deploy from a branch → `main`, `/ (root)`.

## To do
- Founder photos and bios (about.html)
- Check the day timelines against the Wave/Loop flowcharts
- Confirm with HUG that the microscopy images can be published
- Replace the mailto form with a form service (e.g. Formspree) once info@carevix.ch exists
