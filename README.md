# UnaVix website

Static site (HTML, CSS, JavaScript). No build step, no dependencies.

## Pages
- `index.html`: home (interactive microscope hero, the problem, the pathway in brief, what we offer)
- `solutions.html`: Wave and Loop clinic models (concepts, pilot planned in Cameroon), GyroStainer (`#gyrostainer`) and the telecytology portal (`#portal`). Each has a status pill; keep them honest as things progress
- `technology.html`: scroll-driven pathway from self-sample to treatment, why cytology, thermal ablation
- `about.html`: founders, collaborators and partners
- `get-involved.html`: contact form that opens an email to info@carevix.ch. Preselect a topic with `get-involved.html?topic=quote` (also `lab`, `portal`, `funding`, `research`, `press`, `join`, `curious`)
- `gyrostainer.html`, `telecytology.html`: redirects to the matching section of `solutions.html`, so old links keep working

## Structure
- `assets/css/style.css`: all styles; brand colours are at the top
- `assets/js/main.js`: all interactions
- `assets/img/`: logos and photos

## Publish on GitHub Pages
Settings → Pages → Deploy from a branch → `main`, `/ (root)`.

## To do
- Founder bios (about.html)
- Check the day timelines against the Wave/Loop flowcharts
- Add evidence for "why cytology" (technology.html) once it is available
- Confirm with HUG that the microscopy images can be published
- Replace the mailto form with a form service (e.g. Formspree) once info@carevix.ch exists
