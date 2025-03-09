import type { View } from "@finos/perspective";
import { ViewConfigUpdate } from "@finos/perspective/dist/esm/ts-rs/ViewConfigUpdate.js";
import xlsxInit, { Workbook, Table, TableColumn } from "wasm-xlsxwriter/web";

export default toExcelFileBuffer;

/**
 * TODO: Add row/columns groups
 */
async function toExcelFileBuffer(
  views: Record<string, View>,
): Promise<Uint8Array> {
  await xlsxInit();

  const workbook = new Workbook();

  await Promise.all(
    Object.entries(views).map(async ([title, view], idx) => {
      const sheetName = `${idx + 1}_${title.slice(0, 20).replace(/[^a-z 0-9A-Z]/gi, "_")}`;
      const worksheet = workbook.addWorksheet();
      worksheet.setName(sheetName);
      const table = new Table();
      const data = (await view.to_columns()) as Record<string, Array<unknown>>;
      const config = (await view.get_config()) as ViewConfigUpdate;
      const columns: TableColumn[] = [];
      const dataRowIndexStart = 2; // 3rd row;
      const dataColIndexStart = 1; // 2nd col;
      Object.entries(data).forEach(([columnName, colValues], index) => {
        const isRowPath = "__ROW_PATH__" === columnName;
        const tblCol = new TableColumn().setHeader(
          config.group_by?.join(",") ?? columnName,
        );
        columns.push(tblCol);
        const ungroupedColValues = colValues.map((colVal) => {
          // Is colVal a row path?
          if (isRowPath && Array.isArray(colVal)) {
            if (0 === colVal.length) {
              return "TOTAL";
            }
            return colVal[colVal.length - 1];
          }
          return colVal;
        });
        worksheet.writeColumn(
          dataRowIndexStart,
          index + dataColIndexStart,
          ungroupedColValues,
        );
      });
      const rows = await view.num_rows();
      // note view.num_cols() excludes row path col when the view is grouped
      const cols = ((await view.column_paths()) as string[]).length;
      const tbl = table.setName(sheetName).setColumns(columns);
      worksheet.addTable(
        dataRowIndexStart - 1,
        dataColIndexStart,
        dataRowIndexStart + rows - 1,
        dataColIndexStart + cols - 1,
        tbl,
      );
    }),
  );

  return workbook.saveToBufferSync();
}
