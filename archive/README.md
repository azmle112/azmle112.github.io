# Local archive

This directory keeps source material used to verify and maintain the site.

- `source/resume_old.pdf`: original resume supplied for the first build.
- `source/portrait-original.jpg`: original portrait supplied for the first build.
- `scripts/create_public_cv.py`: generator for the privacy-safe public academic CV.
- The public download at `public/files/cv-zh.pdf` omits private contact and identity fields from the original resume.
- The generator requires Python with `reportlab`; run it from the repository root after updating its structured content.
- Keep dated source files here when the resume or portrait changes.

Files under `archive/` are not shipped by Astro.
