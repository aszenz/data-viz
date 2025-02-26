import perspective, { type Table, type View } from "@finos/perspective";
import perspective_viewer, {
  type HTMLPerspectiveViewerElement,
  ViewerConfigUpdate,
} from "@finos/perspective-viewer";
import PSP_SERVER_WASM from "@finos/perspective/dist/wasm/perspective-server.wasm?file";
import PSP_CLIENT_WASM from "@finos/perspective-viewer/dist/wasm/perspective-viewer.wasm?file";
// register web component
import "@finos/perspective-workspace";
import "@finos/perspective-workspace/dist/css/pro.css";
import "@finos/perspective-viewer";
import "@finos/perspective-viewer-d3fc";
import "@finos/perspective-viewer-datagrid";
import "@finos/perspective-viewer/dist/css/pro.css";
import "./index.css";
import "./summary/plugin";
import xlsxInit from "wasm-xlsxwriter/web";
import XLSX_WASM from "wasm-xlsxwriter/web/wasm_xlsxwriter_bg.wasm?file";
import TYPST_WASM from "@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?file";
import { $typst } from "@myriaddreamin/typst.ts/dist/esm/contrib/snippet.mjs";
import toExcelFileBuffer from "./excel";
import toPdf from "./pdf";

console.log({ SERVER_WASM: PSP_SERVER_WASM, CLIENT_WASM: PSP_CLIENT_WASM });

await Promise.all([
  perspective.init_server(fetch(PSP_SERVER_WASM)),
  perspective_viewer.init_client(fetch(PSP_CLIENT_WASM)),
  xlsxInit({ module_or_path: XLSX_WASM }),
  $typst.setCompilerInitOptions({
    getModule: () => TYPST_WASM,
  }),
]);

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
          const data = fileLoadedEvent.target?.result ?? null;
          if (null === data) {
            return;
          }
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
    const widgets = workspace.workspace.getAllWidgets();
    const views = await Promise.all(
      widgets.map(
        async (widget) =>
          [
            widget.title.label ?? "",
            (await widget.viewer.getView()) as View,
          ] as const,
      ),
    );
    const viewsMap = Object.fromEntries(views);
    const buffer = await toExcelFileBuffer(viewsMap);
    // write this uint8 buffer to a new file
    downloadFile(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${document.title}.xlsx`,
    );
  });
});
$exportAsPDFBtn?.addEventListener("click", async () => {
  return withLoader($loader, async () => {
    const widgets = workspace.workspace.getAllWidgets();
    return withLoader($loader, async () => {
      const views = await Promise.all(
        widgets.map(
          async (widget) =>
            [
              widget.title.label ?? "",
              (await widget.viewer.getView()) as View,
            ] as const,
        ),
      );
      const viewsMap = Object.fromEntries(views);
      const pdfFile = await toPdf({
        views: viewsMap,
        maxRowsPerView: 1000,
        maxColsPerView: 10,
      });
      downloadFile(pdfFile, `${document.title}.pdf`);
    });
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

function downloadFile(file: Blob, fileName: string): void {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
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
