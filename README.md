# UnaVix website

Static site (HTML, CSS, JavaScript). No build step, no dependencies.

## Pages
- `index.html`: home (microscope hero, what the tools can be used for, status of each tool, next steps, partners)
- `technologies.html`: GyroStainer (`#gyrostainer`), the telepathology portal (`#portal`) and machine learning (`#ai`), each with a status pill; keep them honest as things progress
- `cervical-screening.html`: our first focus: the problem, the same-day pathway, a scroll-driven walk through each step, why cytology, thermal ablation
- `about.html`: founders, collaborators and partners
- `get-involved.html`: contact form, sent through Web3Forms to info@unavix.ch. Preselect a topic with `/get-involved?topic=pilot` (also `funding`, `lab`, `portal`, `research`, `press`, `join`, `curious`)
- `solutions.html`, `technology.html`, `gyrostainer.html`, `telecytology.html`: redirects from old addresses, so old links keep working

## Structure
- `assets/css/style.css`: all styles; brand colours are at the top
- `assets/js/main.js`: all interactions
- `assets/img/`: logos and photos

## Publish on GitHub Pages
Settings → Pages → Deploy from a branch → `main`, `/ (root)`.

## To do
- Founder bios (about.html)
- Add evidence for "why cytology" (technology.html) once it is available
- Confirm with HUG that the microscopy images can be published
