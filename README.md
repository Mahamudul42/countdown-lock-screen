# Research Orbit

[Open Research Orbit on GitHub Pages](https://mahamudul42.github.io/countdown-lock-screen/)

An interactive countdown and wallpaper studio for a Computer Science PhD paper. The planning target is **January 29, 2027 at 11:59 PM in Chicago (CST)**. The brief supplies the date. The time and six-step research plan were chosen for this challenge. The timeline and countdown logic live in `src/data.ts`.

## Run locally

Use Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

`npm run build` type-checks the project and creates the production site in `dist/`. Run `npm run preview` to serve that build locally.

## GitHub Pages

In the GitHub repository, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. Push the project to the `main` branch or run **Deploy Research Orbit to GitHub Pages** from the Actions tab. The workflow builds the Vite app and deploys `dist/`. Relative asset paths support both a user site and a repository subpath.

## Challenge files

- [Promotional cover, 1536 × 1024](public/research-orbit-cover.png)
- [Glacier lock screen, 1440 × 2560](public/research-orbit-wallpaper.png)
- [Submission reflection](submission-answer.txt)

The website clock updates live. An exported wallpaper records the day count, first incomplete milestone, and palette at the time of download. Milestone progress and palette are saved in the current browser.

## Art credits

The lunar globe uses the [NASA Scientific Visualization Studio CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/). See [texture credits](public/textures/CREDITS.txt). The cover uses artwork from the Glacier wallpaper export and larger type for the phone mockup. Its preview clock sits in the area reserved for the device clock.

<details>
<summary>Promotional background art direction · built-in ImageGen</summary>

Use case: ads-marketing. Create a text-free 3:2 landscape photographic background plate for the cover of Research Orbit, a Computer Science PhD submission countdown. Premium science journal art direction, monochromatic midnight navy and soft silver with extremely subtle icy blue. A monumental curved lunar horizon sweeps diagonally across the bottom of the picture, starting near 74 percent down at left, descending out of frame at right. Detailed silver lunar regolith and a few sharp craters along its grazing-lit edge, deep inky interior. A single very thin pale cyan orbital arc crosses the far right background. Upper three quarters is predominantly near-black space with very few faint pinpoint stars, lots of calm negative space at mid-left for a title and at right for a separately composited real phone. Refined, restrained, tactile high-end space photography with natural chiaroscuro and beautiful detail. No devices, typography, labels, glyphs, fake lettering, flares, nebula clouds, watermarks or logos. Landscape 1536 by 1024.

</details>
