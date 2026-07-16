import PDFDocument from 'pdfkit';

function formatHours(hours: number): string {
  return Number(hours).toString();
}

export function buildTimeSummaryPdf(
  rows: { name: string; hours: number }[],
  totalHours: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('Time Summary', { align: 'center' });
    doc.moveDown(1);

    const tableLeft = doc.page.margins.left;
    const tableWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = tableWidth / 2;
    const rowHeight = 26;
    const cellPadding = 8;

    const tableRows: { task: string; hours: string; bold: boolean }[] = [
      { task: 'Task', hours: 'Hours Worked', bold: true },
      ...rows.map((row) => ({
        task: row.name,
        hours: formatHours(row.hours),
        bold: false,
      })),
      { task: 'Total', hours: formatHours(totalHours), bold: true },
    ];

    let y = doc.y;
    for (const row of tableRows) {
      doc.rect(tableLeft, y, colWidth, rowHeight).stroke();
      doc.rect(tableLeft + colWidth, y, colWidth, rowHeight).stroke();

      doc.font(row.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11);
      doc.text(row.task, tableLeft + cellPadding, y + cellPadding, {
        width: colWidth - cellPadding * 2,
      });
      doc.text(row.hours, tableLeft + colWidth + cellPadding, y + cellPadding, {
        width: colWidth - cellPadding * 2,
      });

      y += rowHeight;
    }

    doc.end();
  });
}
