import { Link } from "@/i18n/routing";

const rows = [
  ["Best fit", "Fast visual box mockups and interactive reviews", "Broader packaging design and dieline workflows"],
  ["Browser based", "Yes", "Yes"],
  ["Custom box dimensions", "Yes", "Yes"],
  ["Per-face artwork", "Yes", "Yes"],
  ["Interactive 3D preview", "Yes — orbit, materials and supported openings", "Yes"],
  ["PNG / visual exports", "Yes", "Yes, with broader rendering options"],
  ["Cloud save and share", "Yes", "Yes"],
  ["Production dielines", "No — use your converter or packaging CAD", "Available for supported structures and workflows"],
  ["Template library", "Focused box workflow", "Large packaging template library"],
];

export default function PacdoraComparison() {
  return (
    <section className="landing-section" aria-labelledby="pacdora-comparison-title">
      <div className="landing-container blog-post-body">
        <h2 id="pacdora-comparison-title">3D Box Studio vs. Pacdora: which one fits your job?</h2>
        <p>
          The useful question is not which tool is universally better. It is whether you need a
          fast, free 3D packaging mockup for visual review or a broader packaging platform with
          structural and template workflows. This comparison focuses on that practical choice.
        </p>
        <div className="table-scroll" role="region" aria-label="3D Box Studio and Pacdora feature comparison" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Capability</th>
                <th scope="col">3D Box Studio</th>
                <th scope="col">Pacdora</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([capability, studio, pacdora]) => (
                <tr key={capability}>
                  <th scope="row">{capability}</th>
                  <td>{studio}</td>
                  <td>{pacdora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Choose 3D Box Studio when...</h3>
        <p>
          You already know the approximate box dimensions and want to upload artwork, inspect the
          package in 3D, test supported opening motions, and create a visual for a client, supplier,
          e-commerce draft, or internal review. <Link href="/studio">Open the free 3D box maker</Link>.
        </p>
        <h3>Choose a fuller packaging platform when...</h3>
        <p>
          You need a large structure library, production-oriented dielines, or a broader packaging
          workflow. 3D Box Studio intentionally does not claim to replace structural CAD or a
          converter-provided dieline.
        </p>
        <p>
          If your main goal is simply to create a custom visual mockup, see the{" "}
          <Link href="/blog/how-to-create-3d-product-box-mockup-online">complete 3D box mockup guide</Link>{" "}
          for a step-by-step workflow.
        </p>
      </div>
    </section>
  );
}
