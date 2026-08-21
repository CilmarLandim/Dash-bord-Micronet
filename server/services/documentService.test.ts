import fs from 'fs';
import { afterAll, describe, expect, it } from 'vitest';
import { generateDOCX } from './documentService';

const generatedFiles: string[] = [];

afterAll(() => {
  generatedFiles.forEach((filePath) => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
});

describe('documentService', () => {
  it('gera um arquivo DOCX válido com os dados recebidos', async () => {
    const document = await generateDOCX('report', {
      titulo: 'Relatório de teste',
      periodo: 'Agosto de 2026',
      responsavel: 'Micronet Agent',
    });
    generatedFiles.push(document.filePath);

    expect(document.format).toBe('docx');
    expect(document.filePath.endsWith('.docx')).toBe(true);
    expect(fs.existsSync(document.filePath)).toBe(true);
    expect(fs.readFileSync(document.filePath).subarray(0, 2).toString()).toBe('PK');
  });
});
