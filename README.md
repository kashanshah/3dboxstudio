<p align="center">
  <a href="https://3dboxstudio.com/">
    <img src="./public/logo.svg" alt="3D Box Studio" width="280" />
  </a>
</p>

# 3D Box Studio

**Free packaging box designer** in your browser at [3dboxstudio.com](https://3dboxstudio.com)—no signup. Preview folding cartons and mailer-style boxes in **WebGL**: dimensions (mm / cm / in), PBR material presets, lid / split-top / door openings, per-face artwork with rotation, HDRI lighting, viewport PNG export, optional **15s viewport recording**, **cloud save & share links**, and **JSON import/export** for offline backups.

The project is also **open source** under the MIT License—issues and PRs welcome on [GitHub](https://github.com/kashanshah/3dboxstudio).

## Stack

- [Next.js](https://nextjs.org/) (App Router, static generation + SSR)
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) + [Drei](https://github.com/pmndrs/drei) + [three.js](https://threejs.org/)

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Build for production:

```bash
npm run build
npm start   # production server
```

## Environment

Create a `.env` file (see `.env.example`) and set:

- **`NEXT_PUBLIC_SITE_ORIGIN`** — Full origin of your deployment, **no trailing slash**, e.g. `https://www.3dboxstudio.com`. Used for canonical URLs, Open Graph, JSON-LD, and the sitemap.
- **`DATABASE_URL`** — Neon Postgres pooled connection string (server-only). Run `db/schema.sql` once against your database.
- **`AWS_*`** — S3 credentials and bucket for share image uploads (server-only). Shared face images are stored under `AWS_S3_SHARE_PREFIX` (default `shares/`).

Share links are created from **File → Save** or **Save As** in the studio. Designs upload to S3; config is stored in Neon Postgres. Viewing a share at `/studio?share=…` is public; restricting share creation to registered users can be added later in `src/server/shareAuth.ts`.

## License & contributing

Licensed under the [MIT License](./LICENSE). Issues and pull requests are welcome on [GitHub](https://github.com/kashanshah/3dboxstudio).

## Support the project

If this tool saves you time, you can help fund hosting and continued development via [**Buy Me a Coffee**](https://buymeacoffee.com/kashanshah). A floating widget is included on the site.

## Credits

Maintained by **Syed Kashan Ali Shah** ([@kashanshah](https://github.com/kashanshah)).
