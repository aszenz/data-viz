import perspective, { type Table, type View } from "@finos/perspective";
import "@finos/perspective-workspace";
import "@finos/perspective-workspace/dist/css/pro.css";
import "@finos/perspective-viewer";
import "@finos/perspective-viewer-d3fc";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer/dist/css/pro.css";
import "./index.css";
import "./summary/plugin";
import type {
  HTMLPerspectiveViewerElement,
  ViewerConfigUpdate,
} from "@finos/perspective-viewer";
import wasmFilename from "@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?file";
import pdfLayoutCode from "./pdf-layout.typ?text";

const $saveLayoutBtn = document.getElementById(
  "saveLayoutBtn",
) as HTMLButtonElement;
const $loader = document.getElementById("loader") as HTMLDivElement;
const $exportAsExcelBtn = document.getElementById(
  "exportAsExcelBtn",
) as HTMLButtonElement;
const $exportAsPDFBtn = document.getElementById(
  "exportAsPDFBtn",
) as HTMLButtonElement;
const $addDatasource = document.getElementById(
  "addDatasource",
) as HTMLInputElement;
const worker = await perspective.worker();
if (!("workspace" in window)) {
  throw new Error("Workspace not loaded");
}
const workspace = window.workspace as PerspectiveWorkspace;

$saveLayoutBtn?.addEventListener("click", async () => {
  localStorage.setItem("layout", JSON.stringify(await workspace.save()));
});
$addDatasource?.addEventListener("change", ({ target }) => {
  if (null === target || !("files" in target)) {
    throw new Error("Bad input");
  }
  const files = target.files;
  if (!(null === files || files instanceof FileList)) {
    throw new Error("Bad files");
  }
  return withLoader($loader, () =>
    Promise.all(
      [...(files ?? [])].map((file) => {
        const reader = new FileReader();
        reader.onload = function (fileLoadedEvent) {
          let data = fileLoadedEvent.target?.result;
          workspace.addTable(file.name, worker.table(data));
          workspace.addViewer({ table: file.name });
        };

        if (file.name.endsWith(".feather") || file.name.endsWith(".arrow")) {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsText(file);
        }
      }),
    ),
  );
});
$exportAsExcelBtn?.addEventListener("click", async () => {
  return withLoader($loader, async () => {
    const XLSX = await import("xlsx/xlsx.mjs");
    const widgets = workspace.workspace.getAllWidgets();
    const workbook = XLSX.utils.book_new();

    await Promise.all(
      widgets.map(async (widget) => {
        const view = await widget.viewer.getView();
        const data = await view.to_json();
        const sheet = XLSX.utils.json_to_sheet(data);
        const sheetName = widget.title.label
          ?.slice(0, 20)
          .replace(/[^a-z 0-9A-Z]/gi, "_");
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
      }),
    );

    XLSX.writeFile(workbook, `${document.title}.xlsx`, { compression: true });
  });
});
$exportAsPDFBtn?.addEventListener("click", async () => {
  const { $typst } = await import(
    "@myriaddreamin/typst.ts/dist/esm/contrib/all-in-one-lite.mjs"
  );
  $typst.setCompilerInitOptions({ getModule: () => `/build/${wasmFilename}` });
  return withLoader($loader, async () => {
    const widgets = workspace.workspace.getAllWidgets();
    const dataTables = await Promise.all(
      widgets.map(async (widget) => {
        const view = (await widget.viewer.getView()) as View;
        const viewNumCols = await view.num_columns();
        if (viewNumCols > 10) {
          console.info(
            `View has too many columns (${viewNumCols}), only 10 columns can be exported to PDF, deselect some columns`,
          );
        }
        const viewNumRows = await view.num_rows();
        if (viewNumRows > 10000) {
          console.info(
            `View has too many rows (${viewNumRows}), only 10k rows can be exported to PDF, filter the view`,
          );
        }

        return view.to_json({
          end_row: 10000,
          end_col: 10,
        });
      }),
    );
    const encoder = new TextEncoder();
    const listOfTables = JSON.stringify(dataTables);
    await $typst.resetShadow();
    await $typst.mapShadow("/assets/data.json", encoder.encode(listOfTables));
    const pdfData = await $typst.pdf({ mainContent: pdfLayoutCode });
    if (undefined === pdfData) {
      return alert("Failed to generate PDF");
    }
    const pdfFile = new Blob([pdfData], { type: "application/pdf" });

    // Create element with <a> tag
    const link = document.createElement("a");

    // Add file content in the object URL
    link.href = URL.createObjectURL(pdfFile);

    // Add file name
    link.target = "_blank";

    // Add click event to <a> tag to save file.
    link.click();
    URL.revokeObjectURL(link.href);
  });
});
$loader.style.display = "none";

async function withLoader($loader: HTMLDivElement, fn: Function) {
  $loader.style.display = "block";
  try {
    await fn();
  } finally {
    $loader.style.display = "none";
  }
}

interface PerspectiveWorkspace extends HTMLElement {
  get side(): "left" | "right";
  set side(side: "left" | "right");
  get tables(): Map<string, Promise<Table>>;
  restore(config: object): Promise<void>;
  flush(): Promise<void>;
  save(): Promise<object>;
  addViewer(config: Config): void;
  addTable(table: string, datasource: Promise<Table>): void;
  getTable(name: string): Promise<Table>;
  workspace: {
    getAllWidgets(): ReadonlyArray<PerspectiveWorkspaceWidget>;
  };
  removeTable(name: string): boolean;
}

interface Config extends Partial<ViewerConfigUpdate> {
  table: string;
  master?: boolean;
  linked?: boolean;
  editable?: boolean;
  selectable?: boolean;
}

interface PerspectiveWorkspaceWidget {
  _id?: string;
  viewer: HTMLPerspectiveViewerElement;
  get title(): {
    get label(): null | string;
  };
  set master(boolean);
  get master(): boolean;
  get name(): string;
  get linked(): boolean;
  set linked(boolean);
  toggleConfig: () => void;
  load(data: Promise<Table> | Table): Promise<void>;
  restore(config: Config): void;
  save(): Promise<void>;
  removeClass(className: string): void;
  close(): void;
}
