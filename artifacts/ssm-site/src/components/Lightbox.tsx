import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface LightboxProps {
  images: string[];
  index: number;
  alt?: string;
  onClose: () => void;
  onNav: (next: number) => void;
}

export default function Lightbox({ images, index, alt = 'Image', onClose, onNav }: LightboxProps) {
  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;

  const prev = useCallback(() => { if (hasPrev) onNav(index - 1); }, [hasPrev, index, onNav]);
  const next = useCallback(() => { if (hasNext) onNav(index + 1); }, [hasNext, index, onNav]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="lightbox-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Close */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Counter */}
        {images.length > 1 && (
          <p className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-xs text-white/60 tracking-widest">
            {index + 1} / {images.length}
          </p>
        )}

        {/* Prev */}
        {hasPrev && (
          <button
            type="button"
            aria-label="Previous"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Image */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={index}
            src={images[index]}
            alt={`${alt} ${index + 1}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="max-w-[90vw] max-h-[88vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </AnimatePresence>

        {/* Next */}
        {hasNext && (
          <button
            type="button"
            aria-label="Next"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Teal bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary/60" />
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
