// 접근성 관련 유틸리티 함수들

// 화면 리더 전용 텍스트 읽기
export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  
  document.body.appendChild(announcement);
  announcement.textContent = message;
  
  // 2초 후 제거
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 2000);
};

// 포커스 트랩 (모달 등에서 사용)
export class FocusTrap {
  private element: HTMLElement;
  private previouslyFocusedElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];

  constructor(element: HTMLElement) {
    this.element = element;
  }

  activate() {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
    this.updateFocusableElements();
    this.focusFirstElement();
    document.addEventListener('keydown', this.handleKeyDown);
  }

  deactivate() {
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
    }
  }

  private updateFocusableElements() {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];

    this.focusableElements = Array.from(
      this.element.querySelectorAll(focusableSelectors.join(','))
    ) as HTMLElement[];
  }

  private focusFirstElement() {
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const currentFocusIndex = this.focusableElements.indexOf(
      document.activeElement as HTMLElement
    );

    if (event.shiftKey) {
      // Shift + Tab (역방향)
      const previousIndex = currentFocusIndex <= 0 
        ? this.focusableElements.length - 1 
        : currentFocusIndex - 1;
      
      this.focusableElements[previousIndex]?.focus();
      event.preventDefault();
    } else {
      // Tab (정방향)
      const nextIndex = currentFocusIndex >= this.focusableElements.length - 1 
        ? 0 
        : currentFocusIndex + 1;
      
      this.focusableElements[nextIndex]?.focus();
      event.preventDefault();
    }
  };
}

// 키보드 네비게이션 헬퍼
export const handleKeyboardNavigation = (
  event: React.KeyboardEvent,
  onEnter?: () => void,
  onSpace?: () => void,
  onEscape?: () => void
) => {
  switch (event.key) {
    case 'Enter':
      if (onEnter) {
        event.preventDefault();
        onEnter();
      }
      break;
    case ' ':
      if (onSpace) {
        event.preventDefault();
        onSpace();
      }
      break;
    case 'Escape':
      if (onEscape) {
        event.preventDefault();
        onEscape();
      }
      break;
  }
};

// ARIA 라벨 생성 헬퍼
export const generateAriaLabel = (
  primaryText: string,
  secondaryText?: string,
  status?: string
): string => {
  const parts = [primaryText];
  
  if (secondaryText) {
    parts.push(secondaryText);
  }
  
  if (status) {
    parts.push(`상태: ${status}`);
  }
  
  return parts.join(', ');
};

// 색상 접근성 검사 (대비율)
export const checkColorContrast = (
  foreground: string,
  background: string
): 'AAA' | 'AA' | 'fail' => {
  // RGB 값 추출 (기본적인 구현)
  const getRGB = (color: string) => {
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);
    const styles = window.getComputedStyle(div);
    const rgb = styles.color.match(/\d+/g);
    document.body.removeChild(div);
    return rgb ? rgb.map(Number) : [0, 0, 0];
  };

  const getLuminance = (r: number, g: number, b: number) => {
    const toLinear = (c: number) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const fgRGB = getRGB(foreground);
  const bgRGB = getRGB(background);
  
  const fgLuminance = getLuminance(fgRGB[0], fgRGB[1], fgRGB[2]);
  const bgLuminance = getLuminance(bgRGB[0], bgRGB[1], bgRGB[2]);
  
  const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                  (Math.min(fgLuminance, bgLuminance) + 0.05);

  if (contrast >= 7) return 'AAA';
  if (contrast >= 4.5) return 'AA';
  return 'fail';
};

// 터치 영역 크기 검사
export const checkTouchTargetSize = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  const minSize = 44; // 44px 최소 권장 크기
  
  return rect.width >= minSize && rect.height >= minSize;
};

// 폰트 크기 접근성 검사
export const checkFontSize = (element: HTMLElement): 'good' | 'acceptable' | 'too-small' => {
  const styles = window.getComputedStyle(element);
  const fontSize = parseInt(styles.fontSize);
  
  if (fontSize >= 16) return 'good';
  if (fontSize >= 14) return 'acceptable';
  return 'too-small';
};