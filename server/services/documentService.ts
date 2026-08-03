import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const DOCUMENTS_DIR = path.resolve(process.cwd(), 'public/documents');

// Garante que o diretório de documentos existe
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

export async function generatePDF(type: string, data: any): Promise<{ id: string; filePath: string; url: string }> {
  const id = `doc_${Date.now()}`;
  const fileName = `${type}_${id}.pdf`;
  const filePath = path.join(DOCUMENTS_DIR, fileName);
  const publicUrl = `/documents/${fileName}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Cabeçalho Micronet
    doc.fontSize(25).text('MICRONET SOLUTIONS', { align: 'center' });
    doc.fontSize(10).text('Agente Virtual de Atendimento', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Título do Documento
    const titles: Record<string, string> = {
      curriculum: 'CURRÍCULO PROFISSIONAL',
      contact: 'SOLICITAÇÃO DE CONTATO',
      second_copy: 'SEGUNDA VIA DE DOCUMENTO',
      research: 'PESQUISA ESCOLAR',
      report: 'RELATÓRIO OPERACIONAL',
      proposal: 'PROPOSTA COMERCIAL'
    };

    doc.fontSize(18).text(titles[type] || 'DOCUMENTO GERAL', { align: 'center' });
    doc.moveDown();

    // Conteúdo baseado nos dados
    doc.fontSize(12);
    Object.entries(data).forEach(([key, value]) => {
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
      doc.font('Helvetica-Bold').text(`${label}: `, { continued: true })
         .font('Helvetica').text(String(value));
      doc.moveDown(0.5);
    });

    // Rodapé
    doc.moveDown(2);
    doc.fillColor('gray').fontSize(8).text(`Documento gerado automaticamente em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    doc.text('Micronet - Todos os direitos reservados', { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      resolve({ id, filePath, url: publicUrl });
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}
