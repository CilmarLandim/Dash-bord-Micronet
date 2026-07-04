import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, BorderStyle, WidthType, HeadingLevel } from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCUMENTS_DIR = path.join(__dirname, '../../documents');

// Criar diretório de documentos se não existir
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

interface DocumentData {
  [key: string]: any;
}

interface GeneratedDocument {
  id: string;
  type: string;
  fileName: string;
  filePath: string;
  format: 'pdf' | 'docx';
  createdAt: Date;
}

// Templates de PDF
function generateCurriculumPDF(data: DocumentData): Buffer {
  const doc = new PDFDocument({
    margin: 40,
    bufferPages: true,
  });

  const buffers: Buffer[] = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  // Cabeçalho
  doc.fontSize(20).font('Helvetica-Bold').text(data.fullName || 'Currículo', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').text('_'.repeat(80), { align: 'center' });
  doc.moveDown(1);

  // Dados Pessoais
  doc.fontSize(12).font('Helvetica-Bold').text('DADOS PESSOAIS');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Email: ${data.email || 'Não informado'}`);
  doc.text(`Telefone: ${data.phone || 'Não informado'}`);
  doc.moveDown(1);

  // Experiência
  if (data.experience) {
    doc.fontSize(12).font('Helvetica-Bold').text('EXPERIÊNCIA PROFISSIONAL');
    doc.fontSize(10).font('Helvetica').text(data.experience);
    doc.moveDown(1);
  }

  // Formação
  if (data.education) {
    doc.fontSize(12).font('Helvetica-Bold').text('FORMAÇÃO ACADÊMICA');
    doc.fontSize(10).font('Helvetica').text(data.education);
    doc.moveDown(1);
  }

  // Habilidades
  if (data.skills) {
    doc.fontSize(12).font('Helvetica-Bold').text('HABILIDADES');
    doc.fontSize(10).font('Helvetica').text(data.skills);
    doc.moveDown(1);
  }

  // Rodapé com data
  doc.fontSize(8).font('Helvetica').text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, {
    align: 'right',
  });

  doc.end();

  return Buffer.concat(buffers);
}

function generateContactPDF(data: DocumentData): Buffer {
  const doc = new PDFDocument({
    margin: 40,
    bufferPages: true,
  });

  const buffers: Buffer[] = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  // Cabeçalho
  doc.fontSize(18).font('Helvetica-Bold').text('FORMULÁRIO DE CONTATO', { align: 'center' });
  doc.moveDown(1);

  // Informações
  doc.fontSize(11).font('Helvetica-Bold').text('INFORMAÇÕES DO CONTATO');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Nome: ${data.name || 'Não informado'}`);
  doc.text(`Email: ${data.email || 'Não informado'}`);
  doc.text(`Telefone: ${data.phone || 'Não informado'}`);
  doc.moveDown(1);

  // Assunto
  doc.fontSize(11).font('Helvetica-Bold').text('ASSUNTO');
  doc.fontSize(10).font('Helvetica').text(data.subject || 'Não informado');
  doc.moveDown(1);

  // Mensagem
  doc.fontSize(11).font('Helvetica-Bold').text('MENSAGEM');
  doc.fontSize(10).font('Helvetica').text(data.message || 'Não informada', {
    align: 'left',
    width: 500,
  });
  doc.moveDown(2);

  // Rodapé
  doc.fontSize(8).font('Helvetica').text(`Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, {
    align: 'right',
  });

  doc.end();

  return Buffer.concat(buffers);
}

function generateSecondCopyPDF(data: DocumentData): Buffer {
  const doc = new PDFDocument({
    margin: 40,
    bufferPages: true,
  });

  const buffers: Buffer[] = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  // Cabeçalho
  doc.fontSize(18).font('Helvetica-Bold').text('SOLICITAÇÃO DE SEGUNDA VIA', { align: 'center' });
  doc.moveDown(1);

  // Informações do Documento
  doc.fontSize(11).font('Helvetica-Bold').text('DOCUMENTO SOLICITADO');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Tipo: ${data.documentType || 'Não informado'}`);
  doc.text(`Número: ${data.documentNumber || 'Não informado'}`);
  doc.moveDown(1);

  // Informações do Titular
  doc.fontSize(11).font('Helvetica-Bold').text('INFORMAÇÕES DO TITULAR');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Nome: ${data.holderName || 'Não informado'}`);
  doc.text(`CPF/CNPJ: ${data.holderDocument || 'Não informado'}`);
  doc.moveDown(1);

  // Observações
  if (data.observations) {
    doc.fontSize(11).font('Helvetica-Bold').text('OBSERVAÇÕES');
    doc.fontSize(10).font('Helvetica').text(data.observations, { width: 500 });
    doc.moveDown(1);
  }

  // Rodapé
  doc.fontSize(8).font('Helvetica').text(`Solicitação realizada em: ${new Date().toLocaleDateString('pt-BR')}`, {
    align: 'right',
  });

  doc.end();

  return Buffer.concat(buffers);
}

function generateResearchPDF(data: DocumentData): Buffer {
  const doc = new PDFDocument({
    margin: 40,
    bufferPages: true,
  });

  const buffers: Buffer[] = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  // Cabeçalho
  doc.fontSize(18).font('Helvetica-Bold').text(data.topic || 'Pesquisa', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').text('_'.repeat(80), { align: 'center' });
  doc.moveDown(1);

  // Informações da Pesquisa
  doc.fontSize(11).font('Helvetica-Bold').text('INFORMAÇÕES');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Tema: ${data.topic || 'Não informado'}`);
  doc.text(`Nível: ${data.level || 'Não informado'}`);
  doc.text(`Páginas: ${data.pages || 'Não informado'}`);
  doc.moveDown(1);

  // Instruções
  if (data.instructions) {
    doc.fontSize(11).font('Helvetica-Bold').text('INSTRUÇÕES ESPECIAIS');
    doc.fontSize(10).font('Helvetica').text(data.instructions, { width: 500 });
    doc.moveDown(1);
  }

  // Conteúdo da Pesquisa
  doc.fontSize(11).font('Helvetica-Bold').text('CONTEÚDO');
  doc.fontSize(10).font('Helvetica').text(data.content || 'Conteúdo da pesquisa será inserido aqui.', {
    width: 500,
    align: 'justify',
  });

  // Rodapé
  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica').text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}`, {
    align: 'right',
  });

  doc.end();

  return Buffer.concat(buffers);
}

function generateReportPDF(data: DocumentData): Buffer {
  const doc = new PDFDocument({
    margin: 40,
    bufferPages: true,
  });

  const buffers: Buffer[] = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  // Cabeçalho
  doc.fontSize(18).font('Helvetica-Bold').text('RELATÓRIO', { align: 'center' });
  doc.moveDown(1);

  // Informações do Relatório
  doc.fontSize(11).font('Helvetica-Bold').text('INFORMAÇÕES');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Tipo: ${data.reportType || 'Não informado'}`);
  doc.text(`Período: ${data.period || 'Não informado'}`);
  doc.text(`Departamento: ${data.department || 'Não informado'}`);
  doc.moveDown(1);

  // Dados Específicos
  if (data.specificData) {
    doc.fontSize(11).font('Helvetica-Bold').text('DADOS');
    doc.fontSize(10).font('Helvetica').text(data.specificData, { width: 500 });
    doc.moveDown(1);
  }

  // Análise
  if (data.analysis) {
    doc.fontSize(11).font('Helvetica-Bold').text('ANÁLISE');
    doc.fontSize(10).font('Helvetica').text(data.analysis, { width: 500, align: 'justify' });
    doc.moveDown(1);
  }

  // Conclusão
  if (data.conclusion) {
    doc.fontSize(11).font('Helvetica-Bold').text('CONCLUSÃO');
    doc.fontSize(10).font('Helvetica').text(data.conclusion, { width: 500, align: 'justify' });
  }

  // Rodapé
  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica').text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, {
    align: 'right',
  });

  doc.end();

  return Buffer.concat(buffers);
}

function generateProposalPDF(data: DocumentData): Buffer {
  const doc = new PDFDocument({
    margin: 40,
    bufferPages: true,
  });

  const buffers: Buffer[] = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  // Cabeçalho
  doc.fontSize(18).font('Helvetica-Bold').text('PROPOSTA COMERCIAL', { align: 'center' });
  doc.moveDown(1);

  // Informações da Proposta
  doc.fontSize(11).font('Helvetica-Bold').text('INFORMAÇÕES DA PROPOSTA');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Tipo: ${data.proposalType || 'Não informado'}`);
  doc.text(`Cliente: ${data.client || 'Não informado'}`);
  doc.moveDown(1);

  // Escopo
  doc.fontSize(11).font('Helvetica-Bold').text('ESCOPO');
  doc.fontSize(10).font('Helvetica').text(data.scope || 'Não informado', { width: 500 });
  doc.moveDown(1);

  // Valor
  doc.fontSize(11).font('Helvetica-Bold').text('VALOR');
  doc.fontSize(12).font('Helvetica-Bold').text(`R$ ${data.value || '0,00'}`, { color: '0066cc' });
  doc.moveDown(1);

  // Validade
  doc.fontSize(11).font('Helvetica-Bold').text('VALIDADE');
  doc.fontSize(10).font('Helvetica').text(`Válida até: ${data.validity || 'Não informado'}`);
  doc.moveDown(1);

  // Condições
  if (data.conditions) {
    doc.fontSize(11).font('Helvetica-Bold').text('CONDIÇÕES');
    doc.fontSize(10).font('Helvetica').text(data.conditions, { width: 500 });
  }

  // Rodapé
  doc.moveDown(2);
  doc.fontSize(8).font('Helvetica').text(`Proposta gerada em: ${new Date().toLocaleDateString('pt-BR')}`, {
    align: 'right',
  });

  doc.end();

  return Buffer.concat(buffers);
}

// Templates de DOCX
function generateCurriculumDOCX(data: DocumentData): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: data.fullName || 'Currículo',
            heading: HeadingLevel.HEADING_1,
            alignment: 'center',
          }),
          new Paragraph({
            text: '',
          }),
          new Paragraph({
            text: 'DADOS PESSOAIS',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: `Email: ${data.email || 'Não informado'}`,
          }),
          new Paragraph({
            text: `Telefone: ${data.phone || 'Não informado'}`,
          }),
          new Paragraph({
            text: '',
          }),
          ...(data.experience
            ? [
                new Paragraph({
                  text: 'EXPERIÊNCIA PROFISSIONAL',
                  heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                  text: data.experience,
                }),
                new Paragraph({
                  text: '',
                }),
              ]
            : []),
          ...(data.education
            ? [
                new Paragraph({
                  text: 'FORMAÇÃO ACADÊMICA',
                  heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                  text: data.education,
                }),
                new Paragraph({
                  text: '',
                }),
              ]
            : []),
          ...(data.skills
            ? [
                new Paragraph({
                  text: 'HABILIDADES',
                  heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                  text: data.skills,
                }),
              ]
            : []),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function generateResearchDOCX(data: DocumentData): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: data.topic || 'Pesquisa',
            heading: HeadingLevel.HEADING_1,
            alignment: 'center',
          }),
          new Paragraph({
            text: '',
          }),
          new Paragraph({
            text: 'INFORMAÇÕES',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: `Tema: ${data.topic || 'Não informado'}`,
          }),
          new Paragraph({
            text: `Nível: ${data.level || 'Não informado'}`,
          }),
          new Paragraph({
            text: `Páginas: ${data.pages || 'Não informado'}`,
          }),
          new Paragraph({
            text: '',
          }),
          ...(data.instructions
            ? [
                new Paragraph({
                  text: 'INSTRUÇÕES ESPECIAIS',
                  heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                  text: data.instructions,
                }),
                new Paragraph({
                  text: '',
                }),
              ]
            : []),
          new Paragraph({
            text: 'CONTEÚDO',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: data.content || 'Conteúdo da pesquisa será inserido aqui.',
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function generateReportDOCX(data: DocumentData): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: 'RELATÓRIO',
            heading: HeadingLevel.HEADING_1,
            alignment: 'center',
          }),
          new Paragraph({
            text: '',
          }),
          new Paragraph({
            text: 'INFORMAÇÕES',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: `Tipo: ${data.reportType || 'Não informado'}`,
          }),
          new Paragraph({
            text: `Período: ${data.period || 'Não informado'}`,
          }),
          new Paragraph({
            text: `Departamento: ${data.department || 'Não informado'}`,
          }),
          new Paragraph({
            text: '',
          }),
          ...(data.specificData
            ? [
                new Paragraph({
                  text: 'DADOS',
                  heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                  text: data.specificData,
                }),
                new Paragraph({
                  text: '',
                }),
              ]
            : []),
          ...(data.analysis
            ? [
                new Paragraph({
                  text: 'ANÁLISE',
                  heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                  text: data.analysis,
                }),
                new Paragraph({
                  text: '',
                }),
              ]
            : []),
          ...(data.conclusion
            ? [
                new Paragraph({
                  text: 'CONCLUSÃO',
                  heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                  text: data.conclusion,
                }),
              ]
            : []),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// Funções públicas de geração
export async function generateDocument(
  type: string,
  data: DocumentData,
  format: 'pdf' | 'docx' = 'pdf'
): Promise<GeneratedDocument> {
  const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString().split('T')[0];
  const typeDir = path.join(DOCUMENTS_DIR, type, timestamp);

  // Criar diretórios
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true });
  }

  let buffer: Buffer;
  let fileName: string;

  try {
    switch (type) {
      case 'curriculum':
        fileName = `${documentId}_curriculum.${format}`;
        if (format === 'pdf') {
          buffer = generateCurriculumPDF(data);
        } else {
          buffer = await generateCurriculumDOCX(data);
        }
        break;

      case 'contact':
        fileName = `${documentId}_contact.${format}`;
        buffer = generateContactPDF(data);
        break;

      case 'second_copy':
        fileName = `${documentId}_second_copy.${format}`;
        buffer = generateSecondCopyPDF(data);
        break;

      case 'research':
        fileName = `${documentId}_research.${format}`;
        if (format === 'pdf') {
          buffer = generateResearchPDF(data);
        } else {
          buffer = await generateResearchDOCX(data);
        }
        break;

      case 'report':
        fileName = `${documentId}_report.${format}`;
        if (format === 'pdf') {
          buffer = generateReportPDF(data);
        } else {
          buffer = await generateReportDOCX(data);
        }
        break;

      case 'proposal':
        fileName = `${documentId}_proposal.${format}`;
        buffer = generateProposalPDF(data);
        break;

      default:
        throw new Error(`Tipo de documento desconhecido: ${type}`);
    }

    // Salvar arquivo
    const filePath = path.join(typeDir, fileName);
    fs.writeFileSync(filePath, buffer);

    return {
      id: documentId,
      type,
      fileName,
      filePath,
      format,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error(`Erro ao gerar documento ${type}:`, error);
    throw error;
  }
}

export async function getDocument(documentId: string): Promise<Buffer | null> {
  try {
    // Procurar arquivo recursivamente
    const findFile = (dir: string): string | null => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const result = findFile(fullPath);
          if (result) return result;
        } else if (file.startsWith(documentId)) {
          return fullPath;
        }
      }
      return null;
    };

    const filePath = findFile(DOCUMENTS_DIR);
    if (!filePath) {
      return null;
    }

    return fs.readFileSync(filePath);
  } catch (error) {
    console.error(`Erro ao recuperar documento ${documentId}:`, error);
    return null;
  }
}

export function deleteDocument(documentId: string): boolean {
  try {
    const findAndDelete = (dir: string): boolean => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (findAndDelete(fullPath)) return true;
        } else if (file.startsWith(documentId)) {
          fs.unlinkSync(fullPath);
          return true;
        }
      }
      return false;
    };

    return findAndDelete(DOCUMENTS_DIR);
  } catch (error) {
    console.error(`Erro ao deletar documento ${documentId}:`, error);
    return false;
  }
}
