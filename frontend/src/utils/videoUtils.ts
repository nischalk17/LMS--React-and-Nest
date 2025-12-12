/**
 * Converts various YouTube URL formats to embeddable format
 */
export function convertToEmbedUrl(url: string): string {
  if (!url) return url;

  // If already an embed URL, return as is
  if (url.includes('youtube.com/embed/') || url.includes('youtu.be/embed/')) {
    return url;
  }

  // Extract video ID from various YouTube URL formats
  let videoId = '';

  // Standard YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (watchMatch) {
    videoId = watchMatch[1];
  }

  // Short URL: https://youtu.be/VIDEO_ID
  if (!videoId) {
    const shortMatch = url.match(/youtu\.be\/([^&\n?#]+)/);
    if (shortMatch) {
      videoId = shortMatch[1];
    }
  }

  // If we found a video ID, return embed URL
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // If no match, return original URL (might be Vimeo or other platform)
  return url;
}

