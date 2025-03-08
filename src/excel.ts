import type { View } from "@finos/perspective";
import { ExcelDataArray } from "wasm-xlsxwriter";
import xlsxInit, { Workbook, Table, TableColumn } from "wasm-xlsxwriter/web";

export default toExcelFileBuffer;

/**
 * TODO: Fix for grouped views
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
      const columns: TableColumn[] = [];
      const dataRowIndexStart = 2; // 3rd row;
      const dataColIndexStart = 1; // 2nd col;
      Object.entries(data).forEach(([columnName, value], index) => {
        const tblCol = new TableColumn().setHeader(columnName);
        columns.push(tblCol);
        worksheet.writeColumn(
          dataRowIndexStart,
          index + dataColIndexStart,
          // TODO: Fix for grouped views, this is not correct
          value as ExcelDataArray,
        );
      });
      const rows = await view.num_rows();
      const cols = await view.num_columns();
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
