# AIX-Extensions-Catalog

A static, front-end application that aggregates and displays extension topics from multiple App Inventor-based communities. Users can browse, search, and filter extensions from Kodular, MIT App Inventor, Niotron, and Android Builder—all without a custom back-end—using a simple GitHub Pages–hosted site with a CORS proxy.

---

## Table of Contents

* [Features](#features)
* [Demo](#demo)
* [Getting Started](#getting-started)

  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
  * [Configuration](#configuration)
* [Usage](#usage)
* [Customization](#customization)
* [Development](#development)
* [Contributing](#contributing)
* [License](#license)

---

## Features

* **Multi-Community Support**
  Fetches extension topics from Kodular, MIT App Inventor, Niotron, and Android Builder.
* **Search & Filter**
  Full-text search across selected communities; filter by community via dropdown.
* **Language Switcher**
  UI available in English, Portuguese, and Spanish; remembers your preference.
* **Infinite Load**
  “Load More” button to incrementally fetch additional topics.
* **CORS Proxy**
  Uses a public CORS proxy (AllOrigins) so you can host entirely static on GitHub Pages.
* **Responsive Design**
  Mobile-first, works seamlessly on desktop and phone.
* **Lightweight & No Back-End**
  Pure HTML/CSS/JavaScript—no server setup required beyond GitHub Pages.

---

## Demo

Live demo:

> https\://<your-github-username>.github.io/<your-repo-name>/

---

## Getting Started

### Prerequisites

* A modern browser (Chrome, Firefox, Safari, Edge)
* GitHub account (to host via GitHub Pages)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/iagolirapasssos/AIX-Extensions-Catalog.git
   cd AIX-Extensions-Catalog
   ```
2. **Push to GitHub**

   ```bash
   git remote add origin https://github.com/iagolirapasssos/AIX-Extensions-Catalog.git
   git push -u origin main
   ```
3. **Enable GitHub Pages**

   * Go to **Settings → Pages**
   * Under “Source,” select `main` branch and `/root` folder
   * Save and wait for your site URL to appear

---

## Configuration

All configuration is client-side in `script.js` and `index.html`:

* **Communities**
  Edit the `communities` array in `script.js` to add, remove, or update community endpoints.
* **Proxy URL**
  By default, uses `https://api.allorigins.win/raw`. For more reliability, you can replace with another CORS-proxy service or your own.
* **Translation Strings**
  Modify the `translations` object in `script.js` to adjust UI text for supported languages.

---

## Usage

1. Open the live site in your browser.
2. Use the **language selector** to switch UI language.
3. Use the **community selector** to choose which forum(s) to query.
4. Enter keywords into the **search box** and click **Search** or press Enter.
5. Browse extension cards; click **View Topic** to open the original forum thread.
6. Click **Load More** to fetch additional items.

---

## Customization

* **Styling**
  Tweak `styles.css` to match your brand colors or adjust layout.
* **Card Template**
  In `script.js`, the `displayExtensions()` function builds each card—feel free to add new fields (e.g., author avatars, tags).
* **Additional Languages**
  To add a new language, extend `translations` and update the `<select id="language-select">` in `index.html`.

---

## Development

If you wish to extend or debug the application:

```bash
# Clone the repo
git clone git@github.com:iagolirapasssos/AIX-Extensions-Catalog.git
cd AIX-Extensions-Catalog

# Open index.html directly in browser or serve locally
# Example: using npm's "serve" package
npm install -g serve
serve .
```

* Edit `script.js` and `styles.css` as needed.
* Refresh your browser to see changes.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/YourFeature`.
3. Commit your changes: `git commit -m "Add your feature"`.
4. Push to your fork: `git push origin feature/YourFeature`.
5. Open a Pull Request against `main`.

Please follow conventional commits and include clear descriptions of your changes.

---

## License

This project is dedicated to the public domain under the [Creative Commons Zero v1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) (CC0 1.0) license. You can copy, modify, distribute, and perform the work—even for commercial purposes—all without asking permission.

---

> **By BosonsHiggs Team (Aril Ogai)**
> [https://github.com/iagolirapasssos/AIX-Extensions-Catalog](https://github.com/iagolirapasssos/AIX-Extensions-Catalog)

