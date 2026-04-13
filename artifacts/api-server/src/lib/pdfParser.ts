import pdfParse from 'pdf-parse';

export async function parsePdfToText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    const text = data.text || '';

    // Basic cleanup — collapse runs of 3+ blank lines to 2, trim trailing spaces per line
    return text
      .split('\n')
      .map((line: string) => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch (error: any) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}
