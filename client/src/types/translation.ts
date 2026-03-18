interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface TranslationResult {
  message: string;
  text: string;
  subtitle_url: string;
  video_url: string;
  segments: Segment[];
}
