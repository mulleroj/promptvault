import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Konfigurace workeru pro PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const importFromDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};

export const importFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
    }

    return fullText;
};

export const importFileContent = async (file: File): Promise<{ content: string, type: 'docx' | 'pdf' | 'txt' }> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'docx':
            return {
                content: await importFromDocx(file),
                type: 'docx'
            };
        case 'pdf':
            return {
                content: await importFromPdf(file),
                type: 'pdf'
            };
        case 'txt':
        case 'md':
            return {
                content: await file.text(),
                type: 'txt'
            };
        default:
            throw new Error(`Nepodporovaný typ souboru: .${extension}`);
    }
};
