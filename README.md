<p align="center">
  <a href="https://3dboxstudio.com/">
    <img src="./public/logo.svg" alt="3D Box Studio" width="280" />
  </a>
</p>

# 3D Box Studio

**Free packaging box designer** in your browser at [3dboxstudio.com](https://3dboxstudio.com)—no signup. Preview folding cartons and mailer-style boxes in **WebGL**: dimensions (mm / cm / in), PBR material presets, lid / split-top / door openings, per-face artwork with rotation, HDRI lighting, viewport PNG export, optional **15s viewport recording**, and **JSON import/export** (designs with embedded images). Work is saved in **localStorage** unless you clear it.

The project is also **open source** under the MIT License—issues and PRs welcome on [GitHub](https://github.com/kashanshah/3dboxstudio).

## Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) + [Drei](https://github.com/pmndrs/drei) + [three.js](https://threejs.org/)

## Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview   # optional local preview of dist/
```

## Environment

Create a `.env` file (see `.env.example`) and set:

- **`VITE_SITE_ORIGIN`** — Full origin of your deployment, **no trailing slash**, e.g. `https://3dboxstudio.com`. Used for canonical URLs, Open Graph, and JSON-LD on the landing page.

## License & contributing

Licensed under the [MIT License](./LICENSE). Issues and pull requests are welcome on [GitHub](https://github.com/kashanshah/3dboxstudio).

## Support the project

If this tool saves you time, you can help fund hosting and continued development via [**Buy Me a Coffee**](https://buymeacoffee.com/kashanshah). A floating widget is also included on the site (script in `index.html`).

## Credits

Maintained by **Syed Kashan Ali Shah** ([@kashanshah](https://github.com/kashanshah)).
