export interface MessageDTO {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AnalysisDTO {
  id: string;
  title: string;
  imageUrl: string;
  imageName: string | null;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  messages: MessageDTO[];
}

export interface AnalysisSummaryDTO {
  id: string;
  title: string;
  imageUrl: string;
  favorite: boolean;
  createdAt: string;
  preview: string;
}
