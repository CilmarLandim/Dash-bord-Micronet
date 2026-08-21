import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

const DOCUMENTS_DIR = path.resolve(process.cwd(), 'public/documents');

if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

const titles: Record<string, string> = {
  curriculum: 'CURRÍCULO PROFISSIONAL',
  contact: 'SOLICITAÇÃO DE CONTATO',
  second_copy: 'SEGUNDA VIA DE DOCUMENTO',
  research: 'PESQUISA ESCOLAR',
  report: 'RELATÓRIO OPERACIONAL',
  proposal: 'PROPOSTA COMERCIAL',
};

export interface GeneratedDocument {
  id: string;
  filePath: string;
  url: string;
  format: 'pdf' | 'docx';
}

function createIdentity(type: string, format: 'pdf' | 'docx') {
  const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const fileName = `${type}_${id}.${format}`;
  return {
    id,
    filePath: path.join(DOCUMENTS_DIR, fileName),
    url: `/documents/${fileName}`,
    format,
  };
}

function readableLabel(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
}

export async function generatePDF(type: string, data: Record<string, unknown>): Promise<GeneratedDocument> {
  const document = createIdentity(type, 'pdf');

  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(document.filePath);
    pdf.pipe(stream);

    pdf.fontSize(18).text(titles[type] || 'DOCUMENTO GERAL', { align: 'center' });
    pdf.moveDown(1.5);

    Object.entries(data).forEach(([key, value]) => {
      pdf.font('Helvetica-Bold').fontSize(12).text(`${readableLabel(key)}: `, { continued: true });
      pdf.font('Helvetica').text(String(value));
      pdf.moveDown(0.5);
    });

    pdf.end();

    stream.on('finish', () => resolve(document));
    stream.on('error', reject);
  });
}

export async function generateDOCX(type: string, data: Record<string, unknown>): Promise<GeneratedDocument> {
  const generated = createIdentity(type, 'docx');
  const contentRows = Object.entries(data).flatMap(([key, value]) => [
    new Paragraph({
      children: [
        new TextRun({ text: `${readableLabel(key)}: `, bold: true }),
        new TextRun({ text: String(value) }),
      ],
      spacing: { after: 140 },
    }),
  ]);

  const document = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: titles[type] || 'DOCUMENTO GERAL',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 360 },
        }),
        ...contentRows,

      ],
    }],
  });

  const buffer = await Packer.toBuffer(document);
  fs.writeFileSync(generated.filePath, buffer);
  return generated;
}

export async function generateDocumentFile(
  type: string,
  data: Record<string, unknown>,
  format: 'pdf' | 'docx',
): Promise<GeneratedDocument> {
  return format === 'docx' ? generateDOCX(type, data) : generatePDF(type, data);
}
