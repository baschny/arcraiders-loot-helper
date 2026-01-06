import { useEffect, useRef, useState } from 'react';

interface UseHoverIntentOptions {
  /**
   * Delay in milliseconds before showing (default: 500ms)
   */
  delayShow?: number;
  /**
   * Delay in milliseconds before hiding (default: 100ms)
   */
  delayHide?: number;
}

export function useHoverIntent<T extends HTMLElement>(
  options: UseHoverIntentOptions = {}
) {
  const { delayShow = 500, delayHide = 100 } = options;
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<T>(null);
  const showTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => {
      // Clear any pending hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      // Set show timeout
      showTimeoutRef.current = window.setTimeout(() => {
        setIsHovered(true);
      }, delayShow);
    };

    const handleMouseLeave = () => {
      // Clear any pending show timeout
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }

      // Set hide timeout
      hideTimeoutRef.current = window.setTimeout(() => {
        setIsHovered(false);
      }, delayHide);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [delayShow, delayHide]);

  return { ref, isHovered };
}
