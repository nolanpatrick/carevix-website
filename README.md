# CareVix website

Static site (HTML, CSS, JavaScript). No build step, no dependencies.

## Pages
- `index.html`: home (interactive microscope hero, scroll-driven pathway)
- `solutions.html`: Wave and Loop side by side, with screen / triage / treat timelines
- `technology.html`: self-sampling, HPV testing, cytology triage (and why cytology), thermal ablation
- `gyrostainer.html`: GyroStainer, with a looping protocol animation and a microscope magnifier
- `telecytology.html`: how remote review works, a simulated platform, and patient data protection
- `about.html`: founders (photo placeholders) and partners
- `get-involved.html`: contact page with topics for everyone; form opens an email to info@carevix.ch. Link to a topic with `get-involved.html?topic=quote` (also `lab`, `funding`, `pathologist`, `research`, `press`, `join`, `curious`)

## Structure
- `assets/css/style.css`: all styles; brand colours are at the top
- `assets/js/main.js`: all interactions
- `assets/img/`: logos and photos

## Publish on GitHub Pages
Settings → Pages → Deploy from a branch → `main`, `/ (root)`.

## To do
- Founder photos and bios (about.html)
- Check the day timelines against the Wave/Loop flowcharts
- Add evidence for "why cytology" (technology.html) once it is available
- Confirm with HUG that the microscopy images can be published
- Replace the mailto form with a form service (e.g. Formspree) once info@carevix.ch exists
