# Third-Party Licenses

This project includes interpreters, WASM runtimes, and documentation from the following open-source projects.

## Background photographs

The Unsplash photographs listed below in `assets/backgrounds/` are used under the [Unsplash License](https://unsplash.com/license), separately from the code license. They have been resized and compressed for local use.

| File | Photographer | Original photograph |
| --- | --- | --- |
| `aurora.jpg` | Stefan Szankowski | [Northern lights over a Norwegian fjord](https://unsplash.com/photos/green-aurora-borealis-over-a-calm-lake-and-mountains-Pws2-4rSBQ0) |
| `snow.jpg` | Dmitrii Shirnin | [Snow-covered pine forest](https://unsplash.com/photos/snow-covered-pine-trees-in-a-serene-winter-forest-mqEKg5D6lnE) |
| `bamboo.jpg` | Kate Kasiutich | [Sunlight through bamboo](https://unsplash.com/photos/sunlight-streams-through-a-dense-bamboo-forest-path-xnWP566J7gI) |
| `piran.jpg` | Josef Kali | [Piran above the Adriatic](https://unsplash.com/photos/coastal-town-with-red-roofs-and-church-by-the-sea-sXj6108497E) |

The editor applies subdued color grading to these photographs. Location captions use the photographers’ location metadata.

## Personal photographs

The four `personal-*.webp` backgrounds are photographs by **Conor Shakory**, supplied by the photographer for this project. They retain their own copyright, separate from the code and stock-photo licenses. The original JPEGs are kept locally; this repository includes resized WebP copies. Caption dates come from EXIF `DateTimeOriginal`, using the camera's local calendar date. Locations come from GPS metadata or confirmation by the photographer. Exact GPS coordinates are not included in the WebP copies.

| Background | Original file | Capture date |
| --- | --- | --- |
| `personal-wengen.webp` | `IMG_20230615_143324.jpg` | 2023-06-15 |
| `personal-trondheim.webp` | `PXL_20240614_205256891.jpg` | 2024-06-14 |
| `personal-lofoten.webp` | `PXL_20240618_112828255.jpg` | 2024-06-18 |
| `personal-lakeside.webp` | `PXL_20251001_210951970.jpg` | 2025-10-01 |

## Background illustrations

The landscape artwork for the animated nature scenes (`creek.webp`, `creek-willow.webp`, `shore.webp`, `shore-dusk.webp`, and `clouds.webp`) was generated for this project with OpenAI's image-generation tool. The scenes combine this artwork with original 3D foreground vegetation, fitted moving water, and cloud shaders. The same images serve as still fallbacks without WebGL. These are original fictional landscapes with no third-party game assets or footage.

The WebP thumbnails in `assets/backgrounds/previews/` are resized copies of the corresponding backgrounds, including the existing Yosemite wallpaper. They retain the same attribution as their source images.

## Three.js

The 3D backgrounds use Three.js 0.182.0, bundled locally in `src/vendor/three/` so the scenes work without a CDN or build step.

**Repository:** https://github.com/mrdoob/three.js

**License:** MIT, copyright 2010–2025 Three.js Authors. The complete license is included in [`src/vendor/three/LICENSE`](src/vendor/three/LICENSE).

---

## BQN (CBQN)

The BQN WASM interpreter in `wasm/bqn/` is built from source from the CBQN project (a BQN implementation in C by dzaima), compiled to WebAssembly using Emscripten. The primitive documentation in `src/bqn-docs.js` is derived from the BQN project by Marshall Lochbaum.

**Build script:** `scripts/build-cbqn-wasm.sh`  
**CBQN repository:** https://github.com/dzaima/CBQN  
**BQN documentation source:** https://mlochbaum.github.io/BQN/help/  
**BQN specification repository:** https://github.com/mlochbaum/BQN  
**CBQN license:** LGPLv3 or GPLv3 or MPL 2.0 (at your option)  
**BQN documentation license:** ISC License

### CBQN

CBQN source code (excluding vendored components noted in its repository) may be used under any of the following licenses:

- GNU Lesser General Public License v3.0 (LGPLv3)
- GNU General Public License v3.0 (GPLv3)
- Mozilla Public License 2.0 (MPL 2.0)

```
Copyright (C) 2021-2025 dzaima and contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, version 3 of the License.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```

Full license texts: [LGPLv3](https://www.gnu.org/licenses/lgpl-3.0.txt) | [GPLv3](https://www.gnu.org/licenses/gpl-3.0.txt) | [MPL 2.0](https://mozilla.org/MPL/2.0/)

### BQN documentation

```
ISC License

Copyright (c) 2020, Marshall Lochbaum

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## Uiua

The Uiua WASM interpreter in `wasm/` is built from source from the Uiua project and runs entirely client-side. The primitive documentation in `src/uiua-docs.js` and font in `fonts/Uiua386.ttf` are also derived from the Uiua project.

**Build script:** `scripts/update-uiua-wasm.sh`  
**Documentation source:** https://www.uiua.org/docs  
**Repository:** https://github.com/uiua-lang/uiua  
**License:** MIT License

```
MIT License

Copyright (c) 2023 Kai Schmidt

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## J

The J WASM interpreter in `wasm/j/` is built from source from the J language (jsource) project by Jsoftware, compiled to WebAssembly using Emscripten. The primitive documentation in `src/j-docs.js` is derived from the J Wiki (NuVoc).

**Build script:** `scripts/build-j-wasm.sh`  
**Repository:** https://github.com/jsoftware/jsource  
**Documentation source:** https://code.jsoftware.com/wiki/NuVoc  
**Interpreter license:** GPL-3.0 License  
**Documentation license:** Creative Commons Attribution-ShareAlike (CC BY-SA)

The J Wiki content is available under the Creative Commons Attribution-ShareAlike license.
Full license text: https://creativecommons.org/licenses/by-sa/4.0/

```
GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
Everyone is permitted to copy and distribute verbatim copies
of this license document, but changing it is not allowed.

[Truncated for brevity - Full text available at https://www.gnu.org/licenses/gpl-3.0.txt]

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
```

---

## Kap

The Kap client-side interpreter in `wasm/kap/` is built from source from the Kap array language project, compiled to JavaScript via Kotlin/JS (Kotlin Multiplatform). The primitive documentation in `src/kap-docs.js` is derived from the Kap project reference documentation.

**Build script:** `scripts/build-kap-js.sh`  
**Repository:** https://codeberg.org/loke/array  
**Website:** https://kapdemo.dhsdevelopments.com/  
**Documentation source:** https://kapdemo.dhsdevelopments.com/reference.html  
**License:** MIT License

```
Copyright (c) 2020-2026 Elias Martenson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Dyalog APL

The Dyalog APL primitive documentation in `src/apl-docs.js` is derived from the official Dyalog documentation.

**Source:** https://docs.dyalog.com/21.0/language-reference-guide/\
**License:** Creative Commons Attribution 4.0 International (CC BY 4.0)

Copyright © 1982-2026 Dyalog Limited

The Dyalog documentation is available under the Creative Commons Attribution 4.0 International license.
This means you are free to:

- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material for any purpose, even commercially

Under the following terms:

- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made.

Full license text: https://creativecommons.org/licenses/by/4.0/

---

## TinyAPL

The TinyAPL WASM interpreter in `wasm/tinyapl/` and documentation in `src/tinyapl-docs.js` are derived from the TinyAPL project.

**Build script:** `scripts/update-tinyapl-wasm.sh`  
**Source:** https://tinyapl.rubenverg.com/  
**Repository:** https://github.com/RubenVerg/tinyapl  
**License:** MIT License

```
Copyright (c) 2023 Madeline Vergani

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

---

## dyalog-safe-exec (Safe3.dyalog)

The Safe3.dyalog file in `docker/Safe3.dyalog` provides secure APL code execution via token whitelisting.

**Repository:** https://github.com/abrudz/dyalog-safe-exec  
**License:** MIT License

```
MIT License

Copyright (c) 2018 Adám Brudzewsky

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
