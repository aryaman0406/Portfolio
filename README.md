<div align="center">
  
  <!-- Badges removed to avoid referencing the previous username. Replace the placeholders below with your own badges if desired. -->

  <br />
  <br />

  <h2 align="center">Personal Portfolio Website</h2>

  Fully responsive personal portfolio website, <br />Responsive for all devices, built using HTML, CSS, and JavaScript.

  <a href="./"><strong>➥ Live Demo</strong></a>

</div>

<br />

### Demo Screeshots

![Portfolio Desktop Demo](./readme-images/desktop.png "Desktop Demo")

## What's new (2025-11)

This repository was refreshed with a modern UI and small interactive features:

- Light / Dark theme toggle (state persists in localStorage).
- Smooth internal link scrolling and an improved responsive header.
- Clickable portfolio cards open a lightweight project modal with details.
- Contact form includes a demo send flow (replace with your backend endpoint).

Images and a favicon are included in `assets/images` and the root `favicon.svg`.

A placeholder resume was added at `assets/resume-placeholder.txt` so the site provides a downloadable CV link; replace it with your actual `assets/resume.pdf` to enable a true PDF download.

### Prerequisites

Before you begin, ensure you have met the following requirements:

* [Git](https://git-scm.com/downloads "Download Git") must be installed on your operating system.

### Run Locally

To run **Portfolio** locally, run this command on your git bash:

Linux and macOS:

```bash
sudo git clone https://github.com/<your-username>/portfolio.git
```

Windows:

```bash
git clone https://github.com/<your-username>/portfolio.git
```

### Contact

If you want to contact me you can reach me at [Twitter](https://www.twitter.com/<your-twitter>).

### License

This project is **free to use** and does not contains any license.

### Deploying to Vercel

This site is a static HTML/CSS/JS portfolio and can be deployed to Vercel with zero configuration. A minimal `vercel.json` is included to enable clean URLs.

Quick steps:

1. Install the Vercel CLI (optional):

```powershell
npm i -g vercel
```

2. From the project root, run the deploy command and follow prompts:

```powershell
vercel
```

3. To deploy to production:

```powershell
vercel --prod
```

If you prefer not to use the CLI, you can connect this GitHub repo to Vercel via the Vercel dashboard and it will deploy automatically on push.
