
import { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from "docx";
import { ExamPaperData } from "../types";

const stripOptionLabel = (text: string): string => {
  if (!text) return "";
  return text.replace(/^(\(?[a-zA-Z0-9]\s?[\)\.]\s?)/i, '').trim();
};

const stripQuestionPrefix = (num: string): string => {
  if (!num) return "";
  return num.replace(/^(Q|Question|Quest|Q\.)\s*\.?\s*/i, '').trim();
};

/**
 * Advanced math parsing for Word. 
 * Detects variables for italics and handles super/subscripts.
 */
const formatMathRun = (content: string, isMath: boolean, baseSize: number, options: { super?: boolean, sub?: boolean } = {}): TextRun[] => {
  // If it's not math (just plain text parts), return single run
  if (!isMath) {
    return [new TextRun({ text: content, size: baseSize })];
  }

  // Inside a math sequence, we split by variables and operators
  // We want to italicize variables (single letters) but keep numbers and operators upright
  const subParts = content.split(/([a-zA-Z]{1}|[\+\-\=\(\)\/])/g);
  
  return subParts.filter(p => p !== "").map(part => {
    const isVariable = /^[a-zA-Z]$/.test(part);
    const isOperator = /^[\+\-\=\/]$/.test(part);
    
    // Adjust spacing: add thin spaces around operators for better legibility in Word
    let text = part;
    if (isOperator) {
      text = ` ${part} `;
    }

    return new TextRun({
      text: text,
      size: options.super || options.sub ? baseSize * 0.75 : baseSize,
      superScript: options.super,
      subScript: options.sub,
      italics: isVariable, // Single variables like 'x' should be italicized
    });
  });
};

/**
 * Parses math notation (^, _) and returns an array of docx TextRuns with professional formatting.
 */
const parseMathToTextRuns = (text: string, baseSize: number = 24): TextRun[] => {
  if (!text) return [];
  
  // Regex to match: 
  // 1. ^{...} or _{...} (braced multi-char)
  // 2. ^x or _x (single char)
  const mathRegex = /(\^\{[^}]+\}|_\{[^}]+\}|\^[a-zA-Z0-9]|_[a-zA-Z0-9])/g;
  const parts = text.split(mathRegex);
  
  const runs: TextRun[] = [];

  parts.forEach(part => {
    if (part.startsWith('^')) {
      const content = part.startsWith('^{') ? part.slice(2, -1) : part.slice(1);
      runs.push(...formatMathRun(content, true, baseSize, { super: true }));
    } else if (part.startsWith('_')) {
      const content = part.startsWith('_{') ? part.slice(2, -1) : part.slice(1);
      runs.push(...formatMathRun(content, true, baseSize, { sub: true }));
    } else {
      // For base text, check if there are standalone equations or variables
      // This is a simplified check: if it contains '=', treat as math context
      const isEquationContext = part.includes('=') || part.includes('+') || part.includes('-');
      runs.push(...formatMathRun(part, isEquationContext, baseSize));
    }
  });

  return runs;
};

export const exportToDocx = async (data: ExamPaperData) => {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 24, // 12pt
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1140,
              right: 1140,
              bottom: 1140,
              left: 1140,
            },
          },
        },
        children: [
          // Header: Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: data.title.toUpperCase(),
                bold: true,
                size: 40,
              }),
            ],
            spacing: { after: 120 },
          }),

          // Divider Line
          new Paragraph({
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 12, color: "000000" },
            },
            spacing: { after: 240 },
          }),

          // Info Grid
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Subject: ", bold: true }),
                          new TextRun({ text: data.subject, underline: {} }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: "Total Marks: ", bold: true }),
                          new TextRun({ text: data.totalMarks, underline: {} }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        spacing: { before: 120 },
                        children: [
                          new TextRun({ text: "Time Allowed: ", bold: true }),
                          new TextRun({ text: data.timeAllowed, underline: {} }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 120 },
                        children: [
                          new TextRun({ text: "Roll No: ", bold: true }),
                          new TextRun({ text: "__________", underline: {} }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 400 } }),

          // Content
          ...data.sections.flatMap((section) => [
            // Section Title
            new Table({
              alignment: AlignmentType.CENTER,
              width: { size: 60, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: section.title.toUpperCase(),
                              bold: true,
                              size: 26,
                            }),
                          ],
                        }),
                      ],
                      margins: { top: 100, bottom: 100, left: 100, right: 100 },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 12 },
                        bottom: { style: BorderStyle.SINGLE, size: 12 },
                        left: { style: BorderStyle.SINGLE, size: 12 },
                        right: { style: BorderStyle.SINGLE, size: 12 },
                      },
                    }),
                  ],
                }),
              ],
            }),

            ...(section.instructions ? [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 200 },
                children: [
                  new TextRun({ text: "(Instructions: ", italic: true, size: 20 }),
                  ...parseMathToTextRuns(section.instructions, 20),
                  new TextRun({ text: ")", italic: true, size: 20 }),
                ],
              }),
            ] : [new Paragraph({ spacing: { before: 200 } })]),

            ...section.questions.flatMap((q) => {
              return [
                new Paragraph({
                  spacing: { before: 200, after: 100 },
                  children: [
                    new TextRun({ text: `Q.${stripQuestionPrefix(q.number)}\t`, bold: true }),
                    ...parseMathToTextRuns(q.text),
                    ...(q.marks ? [new TextRun({ text: `\t[${q.marks}]`, bold: true })] : []),
                  ],
                  tabStops: [
                    { type: AlignmentType.LEFT, position: 720 },
                    { type: AlignmentType.RIGHT, position: 9000 },
                  ],
                }),
                ...(q.subQuestions ? q.subQuestions.map((sub, idx) => {
                  return new Paragraph({
                    indent: { left: 1080 },
                    spacing: { before: 100 },
                    children: [
                      new TextRun({ text: `(${String.fromCharCode(97 + idx)})  `, bold: true }),
                      ...parseMathToTextRuns(stripOptionLabel(sub)),
                    ],
                  });
                }) : []),
              ];
            }),
            new Paragraph({ spacing: { before: 400 } }),
          ]),

          // Footer Marker
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 },
            border: {
              top: { style: BorderStyle.SINGLE, size: 6 },
              bottom: { style: BorderStyle.SINGLE, size: 6 },
            },
            children: [
              new TextRun({ 
                text: "   *** END OF PAPER ***   ", 
                bold: true, 
                size: 22 
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.subject.replace(/\s+/g, '_') || "Exam_Paper"}_Professional.docx`;
  a.click();
  window.URL.revokeObjectURL(url);
};
