import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, AlignmentType, BorderStyle } from 'docx';
import saveAs from 'file-saver';
import { PromptData } from '../types';

export const exportPromptsToDocx = async (prompts: PromptData[]) => {
  if (prompts.length === 0) return;

  const children: any[] = [];

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];

    // 1. Heading: Title
    children.push(
      new Paragraph({
        text: prompt.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 120 },
      })
    );

    // 2. Info: Model | Type
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Model: ${prompt.model} | Typ: ${prompt.type}`,
            size: 20, // 10pt
            color: "666666",
          }),
        ],
        spacing: { after: 200 },
      })
    );

    // 3. Prompt Content
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: prompt.content,
            font: "Courier New",
            size: 22, // 11pt
          }),
        ],
        border: {
          left: { style: BorderStyle.SINGLE, space: 10, color: "CCCCCC", size: 6 },
        },
        spacing: { after: 240, before: 120 },
        indent: { left: 720 },
      })
    );

    // 4. Image (if exists)
    if (prompt.imageBase64) {
      try {
        // Extract base64 data and determine image type
        const matches = prompt.imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const imageType = matches[1]; // png, jpeg, webp, etc.
          const base64Data = matches[2];
          const binaryString = window.atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: bytes,
                  transformation: {
                    width: 400,
                    height: 400,
                  },
                  type: imageType === 'jpeg' || imageType === 'jpg' ? 'jpg' : imageType === 'png' ? 'png' : 'png',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
            })
          );
        }
      } catch (e) {
        console.error("Error adding image to docx", e);
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "[Chyba při vkládání obrázku]",
                color: "FF0000",
              })
            ]
          })
        );
      }
    }

    // 5. Notes (Tips)
    if (prompt.notes) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Tip pro studenty: ${prompt.notes}`,
              italics: true,
              size: 22,
            }),
          ],
          spacing: { before: 120, after: 240 },
        })
      );
    }

    // 6. Page Break (except for the last prompt)
    if (i < prompts.length - 1) {
      children.push(new Paragraph({ pageBreakBefore: true }));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "vyukove_materialy.docx");
};