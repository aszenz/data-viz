#let jsonData = json("/assets/data.json")
#set page(
  paper: "a4",
  margin: (x: 1cm, y: 1.5cm),
  numbering: "1/1",
  number-align: center,
  flipped: true,
)
#set text(size: 8pt)
#for data in jsonData {
  table(
    columns: data.first().keys().map(f => 1fr),
    ..(
      table.header(
        ..data.first().keys().map(k => [*#k*]),
      ),
      data.map(row => row.values().map(col => [#col])),
    ).flatten(),
  )
  pagebreak(weak: true)
}