import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const exportMarkdownFile = (
  markdown: string,
  filename: string,
): void => {
  downloadBlob(
    new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
    filename,
  );
};

export const exportWordFile = async (
  renderedHtml: string,
  filename: string,
): Promise<void> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${renderedHtml}</div>`, "text/html");
  const root = doc.body.firstElementChild;
  const paragraphs: Paragraph[] = [];

  if (root) {
    Array.from(root.children).forEach((node) => {
      const element = node as HTMLElement;
      const tag = element.tagName.toLowerCase();
      const text = element.textContent?.trim() ?? "";
      if (!text) return;

      if (tag === "h1") {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 160 },
            children: [new TextRun({ text, bold: true })],
          }),
        );
        return;
      }
      if (tag === "h2") {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 220, after: 140 },
            children: [new TextRun({ text, bold: true })],
          }),
        );
        return;
      }
      if (tag === "h3") {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 120 },
            children: [new TextRun({ text, bold: true })],
          }),
        );
        return;
      }
      if (tag === "ul" || tag === "ol") {
        const items = Array.from(element.querySelectorAll("li"));
        items.forEach((li, index) => {
          const itemText = li.textContent?.trim() ?? "";
          if (!itemText) return;
          const prefix = tag === "ol" ? `${index + 1}. ` : "• ";
          paragraphs.push(
            new Paragraph({
              spacing: { after: 100 },
              children: [new TextRun(`${prefix}${itemText}`)],
            }),
          );
        });
        return;
      }
      if (tag === "blockquote") {
        paragraphs.push(
          new Paragraph({
            indent: { left: 420 },
            spacing: { before: 100, after: 140 },
            children: [new TextRun({ text: `“${text}”`, italics: true })],
          }),
        );
        return;
      }
      if (tag === "pre") {
        paragraphs.push(
          new Paragraph({
            spacing: { before: 120, after: 140 },
            children: [new TextRun({ text, font: "Courier New" })],
          }),
        );
        return;
      }

      paragraphs.push(
        new Paragraph({
          spacing: { after: 130 },
          children: [new TextRun(text)],
        }),
      );
    });
  }

  if (paragraphs.length === 0) {
    paragraphs.push(new Paragraph({ children: [new TextRun(" ")] }));
  }

  const wordDoc = new Document({
    sections: [{ children: paragraphs }],
  });

  const blob = await Packer.toBlob(wordDoc);
  const nextFilename = filename.endsWith(".docx")
    ? filename
    : filename.replace(/\.(doc|md|pdf)$/i, ".docx");
  downloadBlob(blob, nextFilename);
};

export const exportPdfFromHtml = async (
  renderedHtml: string,
  filename: string,
  themeCss: string,
): Promise<void> => {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-99999px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.padding = "24px";
  container.style.boxSizing = "border-box";
  container.style.background = "#ffffff";
  container.innerHTML = `
    <style>
      .content h1,.content h2,.content h3,.content h4,.content h5,.content h6 { margin-top: 1.2em; margin-bottom: 0.6em; line-height: 1.3; }
      .content p, .content li { margin: 0.65em 0; }
      .content ul, .content ol { padding-left: 1.5em; }
      .content pre { padding: 12px 14px; border-radius: 10px; overflow-x: auto; background:#f8fafc; border:1px solid #e2e8f0; }
      .content blockquote { margin: 1em 0; padding: .6em 1em; border-left: 4px solid #94a3b8; background:#f8fafc; }
      ${themeCss}
    </style>
    <div class="content">${renderedHtml}</div>
  `;
  document.body.appendChild(container);

  try {
    const width = Math.max(container.scrollWidth, container.offsetWidth);
    const height = Math.max(container.scrollHeight, container.offsetHeight);

    const canvas = await html2canvas(container, {
      scale: 1.25,
      useCORS: true,
      backgroundColor: "#ffffff",
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      logging: false,
    });

    const imageData = canvas.toDataURL("image/jpeg", 0.82);
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const drawWidth = pageWidth - margin * 2;
    const drawHeight = (canvas.height * drawWidth) / canvas.width;
    const pageContentHeight = pageHeight - margin * 2;

    let renderedHeight = 0;
    let pageIndex = 0;
    while (renderedHeight < drawHeight) {
      if (pageIndex > 0) {
        pdf.addPage();
      }
      const offsetY = margin - renderedHeight;
      pdf.addImage(
        imageData,
        "JPEG",
        margin,
        offsetY,
        drawWidth,
        drawHeight,
        undefined,
        "FAST",
      );
      renderedHeight += pageContentHeight;
      pageIndex += 1;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
};
