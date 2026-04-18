/**
 * SimplePdfViewer.tsx
 * A lightweight PDF viewer using react-pdf that supports the theme's custom scrollbar.
 */
import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface SimplePdfViewerProps {
  pdfUrl: string;
  className?: string;
  minHeight?: string | number;
}

export function SimplePdfViewer({ pdfUrl, className, minHeight = 500 }: SimplePdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 10);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-y-auto overflow-x-hidden custom-scrollbar ${className}`}
      style={{ minHeight }}
    >
      <Document
        file={pdfUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/20">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Loading PDF...</span>
          </div>
        }
      >
        {numPages &&
          Array.from(new Array(numPages), (_, index) => (
            <div key={`page_${index + 1}`} className="mb-4 flex justify-center shadow-lg">
              <Page
                pageNumber={index + 1}
                width={containerWidth || undefined}
                renderAnnotationLayer={false}
                renderTextLayer={true}
              />
            </div>
          ))}
      </Document>
    </div>
  );
}
