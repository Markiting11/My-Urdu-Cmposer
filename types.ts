
export type AppLanguage = 'EN' | 'UR' | 'AR';
export type HeaderTemplate = 'CLASSIC' | 'MODERN' | 'BOXED' | 'ACADEMIC';

export interface ExamPaperData {
  title: string;
  subject: string;
  totalMarks: string;
  timeAllowed: string;
  sections: ExamSection[];
  language: AppLanguage;
  headerTemplate?: HeaderTemplate;
}

export interface ExamSection {
  title: string;
  instructions?: string;
  questions: ExamQuestion[];
}

export interface ExamQuestion {
  id: string;
  number: string;
  text: string;
  marks?: string;
  subQuestions?: string[];
}

export enum AppState {
  LANDING = 'LANDING',
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  EDITOR = 'EDITOR'
}

export interface UploadedFile {
  file: File;
  preview: string;
}
