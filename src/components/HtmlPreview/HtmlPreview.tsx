export interface HtmlPreviewProps {
  html: string;
  title: string;
  viewport?: 'desktop' | 'mobile';
  mobileWidth?: number;
  height?: number;
  className?: string;
}

export function HtmlPreview({ html, title, viewport = 'desktop', mobileWidth = 375, height = 600, className }: HtmlPreviewProps) {
  const [document, setDocument] = useState(() => previewDocument());
  useEffect(() => { setDocument(previewDocument(html)); }, [html]);
  const width = Number.isFinite(mobileWidth) && mobileWidth > 0 ? mobileWidth : 375;
  const frameHeight = Number.isFinite(height) && height > 0 ? height : 600;

  return (
    <div className={cn('ui-html-preview', className)} data-viewport={viewport}>
      <iframe title={title} sandbox="" referrerPolicy="no-referrer" srcDoc={document}
        className="ui-html-preview-frame" style={{ width: viewport === 'mobile' ? width : '100%', height: frameHeight }} />
    </div>
  );
}
import { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { previewDocument } from './previewDocument';
