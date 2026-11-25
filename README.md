# UnaVix website

Static site (HTML, CSS, JavaScript). No build step, no dependencies.

## Pages
- `index.html`: home (microscope hero, the problem, where UnaVix fits in the screen-triage-treat pathway, status of each tool, the Cameroon pilot, partners)
- `solutions.html`: GyroStainer (`#gyrostainer`), the telecytology portal (`#portal`) and machine learning (`#ai`), each with a status pill; keep them honest as things progress
- `technology.html`: scroll-driven pathway from self-sample to treatment, why cytology, thermal ablation
- `about.html`: founders, collaborators and partners
- `get-involved.html`: contact form, sent through Web3Forms to info@unavix.ch. Preselect a topic with `/get-involved?topic=pilot` (also `funding`, `lab`, `portal`, `research`, `press`, `join`, `curious`)
- `gyrostainer.html`, `telecytology.html`: redirects to the matching section of `solutions.html`, so old links keep working

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
