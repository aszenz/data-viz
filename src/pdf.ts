import type { View } from "@finos/perspective";
import { $typst } from "@myriaddreamin/typst.ts/dist/esm/contrib/snippet.mjs";
import type { ViewerConfigUpdate } from "@finos/perspective-viewer";
import layoutTemplate from "./layout.typ?text";

export default toPdf;

async function toPdf({
  views,
  maxRowsPerView,
  maxColsPerView,
}: {
  views: Record<string, View>;
  maxRowsPerView: number;
  maxColsPerView: number;
}): Promise<Blob> {
  const viewsData = await Promise.all(
    Object.entries(views).map(async ([title, view]) => {
      return {
        title,
        data: await view.to_json({
          formatted: true,
          end_row: maxRowsPerView,
          end_col: maxColsPerView,
        }),
        numOfRows: await view.num_rows(),
        numOfCols: await view.num_columns(),
        config: (await view.get_config()) as ViewerConfigUpdate,
        schema: (await view.schema()) as Record<string, string>,
        maxRows: maxRowsPerView,
        maxCols: maxColsPerView,
      };
    }),
  );
  const encoder = new TextEncoder();
  await $typst.resetShadow();
  const dataFile = "/assets/data.json";
  await $typst.mapShadow(dataFile, encoder.encode(JSON.stringify(viewsData)));
  const pdfData = await $typst.pdf({
    mainContent: layoutTemplate,
    inputs: { data: dataFile },
  });
  if (undefined === pdfData) {
    throw new Error("Failed to generate PDF");
  }
  return new Blob([pdfData], { type: "application/pdf" });
}
