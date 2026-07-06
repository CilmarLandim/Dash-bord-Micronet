import PDFDocument from 'pdfkit';

/**
 * Adiciona papel timbrado (letterhead) ao topo de um documento PDF
 * @param doc - Documento PDFKit
 * @param companyName - Nome da empresa
 * @param companyLogo - URL ou caminho do logo (opcional)
 * @param additionalInfo - Informações adicionais (telefone, email, etc)
 */
export function addLetterhead(
  doc: any,
  companyName: string,
  companyLogo?: string,
  additionalInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  }
): void {
  // Cor da marca (azul corporativo)
  const brandColor = '#0066cc';

  // Barra superior colorida
  doc.rect(0, 0, doc.page.width, 80).fill(brandColor);

  // Logo (se fornecido)
  if (companyLogo) {
    try {
      doc.image(companyLogo, 40, 15, { width: 50, height: 50 });
    } catch (error) {
      console.warn('Não foi possível carregar o logo:', error);
    }
  }

  // Nome da empresa
  doc.fontSize(24).font('Helvetica-Bold').fillColor('white').text(companyName, 100, 20, {
    width: doc.page.width - 140,
    align: 'left',
  });

  // Informações adicionais
  if (additionalInfo) {
    doc.fontSize(9).font('Helvetica');
    let yPos = 50;

    if (additionalInfo.phone) {
      doc.text(`Tel: ${additionalInfo.phone}`, 100, yPos);
      yPos += 12;
    }
    if (additionalInfo.email) {
      doc.text(`Email: ${additionalInfo.email}`, 100, yPos);
      yPos += 12;
    }
    if (additionalInfo.website) {
      doc.text(`Web: ${additionalInfo.website}`, 100, yPos);
      yPos += 12;
    }
  }

  // Linha divisória
  doc.strokeColor('#cccccc').lineWidth(1).moveTo(40, 85).lineTo(doc.page.width - 40, 85).stroke();

  // Retornar cor para preto para o conteúdo
  doc.fillColor('black');

  // Adicionar espaço após o letterhead
  doc.moveDown(2);
}

/**
 * Adiciona rodapé padronizado ao documento
 * @param doc - Documento PDFKit
 * @param companyName - Nome da empresa
 * @param pageNumber - Número da página (opcional)
 */
export function addFooter(doc: any, companyName: string, pageNumber?: number): void {
  const pageHeight = doc.page.height;
  const pageWidth = doc.page.width;

  // Linha divisória
  doc.strokeColor('#cccccc').lineWidth(1).moveTo(40, pageHeight - 50).lineTo(pageWidth - 40, pageHeight - 50).stroke();

  // Texto do rodapé
  doc.fontSize(8).font('Helvetica').fillColor('#666666');

  const footerText = `${companyName} - Documento gerado em ${new Date().toLocaleDateString('pt-BR')}`;
  doc.text(footerText, 40, pageHeight - 40, {
    width: pageWidth - 80,
    align: 'center',
  });

  // Número da página
  if (pageNumber) {
    doc.text(`Página ${pageNumber}`, pageWidth - 80, pageHeight - 40, {
      width: 40,
      align: 'right',
    });
  }

  // Retornar cor para preto
  doc.fillColor('black');
}
