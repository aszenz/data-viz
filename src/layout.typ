// TODO: Fix rendering tables without row groups
#import "@preview/zero:0.3.1"
#let data = json(sys.inputs.at("data"))
#let MAX_ROWS = 100
#let MAX_COLS = 15
#let ROW_PATH_COL = "__ROW_PATH__"

// Color definitions
#let colors = {
  let primary = rgb("#157be0")
  let secondary = rgb("#666")
  (
    primary: primary,
    secondary: secondary,
    background: white,
    level0Bg: primary.lighten(90%),
    level1Bg: primary.lighten(95%),
    level2Bg: primary.lighten(98%),
    level3Bg: primary.lighten(99%),
    borderLight: secondary.lighten(90%),
    borderMedium: primary.darken(20%),
  )
}

#for (i, widgetData) in data.enumerate() {
  set page(
    paper: "a4",
    margin: (x: 1cm, y: 2.0cm),
    header: [
      #set align(center)
      #text(
        size: 9pt,
        fill: colors.primary,
        [
          #smallcaps([= #(if (data.len() > 0) { [#(i + 1).] }) #widgetData.title]),
          #if widgetData.numOfRows > widgetData.maxRows or widgetData.numOfCols > widgetData.maxCols [
            #text(
              size: 8pt,
              fill: colors.secondary,
              [Showing #calc.min(widgetData.maxRows, widgetData.data.len()) of #widgetData.numOfRows rows,
                #calc.min(widgetData.maxCols, widgetData.data.at(0).len()) of #widgetData.numOfCols columns],
            )]
        ],
      )
    ],
    numbering: "1/1",
    number-align: center,
    flipped: true,
  )

  set text(size: 8.5pt)

  let raw_columns = widgetData.data.at(0).keys()
  let base_columns = widgetData.config.columns

  // Get all unique prefixes from the data, maintaining order from raw_columns
  let prefixes = if widgetData.config.split_by.len() > 0 {
    raw_columns.filter(col => col != ROW_PATH_COL).map(col => col.split("|").at(0)).dedup()
  } else { () }
  // Create ordered columns list based on the actual data structure
  let columns = if ROW_PATH_COL in raw_columns { (ROW_PATH_COL,) } else { () }
  columns += raw_columns.filter(col => col != ROW_PATH_COL)

  let max_cols = calc.min(MAX_COLS, columns.len())
  let max_rows = calc.min(MAX_ROWS, widgetData.data.len())

  let data = widgetData.data.slice(0, max_rows)
  let schema = widgetData.schema

  let max_level = data.fold(
    0,
    (max, row) => {
      let path = row.at(ROW_PATH_COL, default: none)
      let level = if path != none { path.len() } else { 0 }
      calc.max(max, level)
    },
  )

  let formatted_data = data.map(row => {
    let path = row.at(ROW_PATH_COL, default: none)
    let level = if path != none { path.len() } else { 0 }
    // Check if this row has any children
    let has_children = data.any(other_row => {
      let other_path = other_row.at(ROW_PATH_COL, default: none)
      (other_path != none and other_path.len() > path.len() and other_path.slice(0, path.len()) == path)
    })
    let is_group = path != none and has_children
    let indent = "  " * if path != none { path.len() } else { 0 }
    let path_display = if path != none {
      if path.len() > 0 {
        indent + path.last()
      } else {
        "Total"
      }
    } else {
      ""
    }
    if path != none { row.insert(ROW_PATH_COL, path_display) }
    (row: row, level: level, is_group: is_group)
  })

  let min_level = formatted_data.fold(9999, (min, item) => calc.min(min, item.level))
  let has_leaf_rows = max_level != min_level

  let prev_level = none

  zero.ztable(
    align: raw_columns
      .slice(0, max_cols)
      .map(col => {
        let baseCol = if col == ROW_PATH_COL { col } else {
          let parts = col.split("|")
          if parts.len() > 1 { parts.at(1) } else { parts.at(0) }
        }
        let colSchema = widgetData.schema.at(baseCol, default: "text")
        if colSchema == "float" or colSchema == "integer" { right } else { left }
      }),
    columns: raw_columns.slice(0, max_cols).map(f => 1fr),
    format: raw_columns
      .slice(0, max_cols)
      .map(col => {
        let baseCol = if col == ROW_PATH_COL { col } else {
          let parts = col.split("|")
          if parts.len() > 1 { parts.at(1) } else { parts.at(0) }
        }
        let schema = widgetData.schema.at(baseCol, default: "text")
        if schema == "float" {
          (
            round: (mode: "places", precision: 2),
            group: (size: 3, separator: sym.space.thin, threshold: 4),
          )
        } else if schema == "integer" {
          (
            round: (mode: "places", precision: 0),
            group: (size: 3, separator: sym.space.thin, threshold: 4),
          )
        } else {
          none
        }
      }),
    inset: (x: 8pt, y: 6pt),
    fill: (_, y) => {
      if y == 0 { colors.background } // Header background
      else if not has_leaf_rows { none } else {
        let item = if y - 1 < formatted_data.len() { formatted_data.at(y - 1) } else { none }
        if item == none { none } else if not item.is_group { colors.background } else if item.level == 0 {
          colors.level0Bg
        } else if item.level == 1 { colors.level1Bg } else if item.level == 2 { colors.level2Bg } else if (
          item.level == 3
        ) {
          colors.level3Bg
        } else {
          colors.background
        }
      }
    },
    stroke: (x, y) => {
      if y == 0 { (bottom: 1pt + colors.borderMedium) } else if y == 1 { (bottom: 0.75pt + colors.borderMedium) } else {
        (bottom: 0.5pt + colors.borderLight)
      }
    },
    ..(
      table.header(
        table.cell(
          rowspan: if prefixes.len() > 0 { 2 } else { 1 },
          align: left + bottom,
          fill: colors.background,
          text(
            weight: "regular",
            fill: colors.secondary,
            size: 8pt,
            [#smallcaps(
                widgetData
                  .config
                  .group_by
                  .enumerate()
                  .map(((i, col)) => {
                    "  " * i + col
                  })
                  .join("\n"),
              )],
          ),
        ),
        ..(
          if prefixes.len() > 1 {
            (
              ..prefixes.map(prefix => {
                let prefix_cols = raw_columns.filter(col => col != ROW_PATH_COL and col.split("|").at(0) == prefix)
                table.cell(
                  colspan: prefix_cols.len(),
                  align: center + bottom,
                  text(weight: "regular", fill: colors.secondary, size: 8pt, [#smallcaps(prefix)]),
                )
              }),
            )
          } else { () }
        ),
        // Base column headers
        ..raw_columns
          .filter(col => col != ROW_PATH_COL)
          .map(col => table.cell(
            align: if widgetData.schema.at(
              if (widgetData.config.split_by.len() > 0) { col.split("|").at(1) } else { col },
              default: "text",
            )
              in ("float", "integer") { right + bottom } else { left + bottom },
            text(
              weight: "regular",
              size: 8pt,
              [#smallcaps(
                  {
                    let parts = col.split("|")
                    if parts.len() > 1 { parts.at(1) } else { parts.at(0) }
                  }.replace("_", "\n"),
                )],
            ),
          )),
      ),
      // Table data rows
      formatted_data.map(item => item
        .row
        .pairs()
        .slice(0, max_cols)
        .map(col => {
          let (colName, colValue) = col
          if colValue == item.row.at(ROW_PATH_COL, default: none) {
            [#colValue]
          } else {
            let colSchema = widgetData.schema.at(colName, default: "text")
            // TODO: Add date formatting
            if colSchema == "date" {
              [#colValue]
            } else if colSchema == "string" {
              // to prevent overflow for long strings
              box(width: 100%, clip: true)[#colValue]
            } else {
              [#colValue]
            }
          }
        })),
    ).flatten(),
  )
}