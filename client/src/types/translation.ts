export interface Segment {
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
  // Raw server paths — used for attach/burn/delete requests
  video_path?: string;
  srt_path?: string;
}

export interface AttachResult {
  message: string;
  output_url: string;
  output_path: string;
}
