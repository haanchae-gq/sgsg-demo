import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,

      toggleDarkMode: () => {
        const newIsDarkMode = !get().isDarkMode;
        set({ isDarkMode: newIsDarkMode });
        applyTheme(newIsDarkMode);
      },

      setDarkMode: (isDark) => {
        set({ isDarkMode: isDark });
        applyTheme(isDark);
      }
    }),
    {
      name: 'sgsg-theme',
      partialize: (state) => ({ isDarkMode: state.isDarkMode })
    }
  )
);

// 다크 모드 CSS 변수 적용
const applyTheme = (isDark: boolean) => {
  const root = document.documentElement;
  
  if (isDark) {
    // 다크 모드 색상
    root.style.setProperty('--adm-color-primary', '#4096ff');
    root.style.setProperty('--adm-color-success', '#73d13d');
    root.style.setProperty('--adm-color-warning', '#ffec3d');
    root.style.setProperty('--adm-color-danger', '#ff7875');
    root.style.setProperty('--adm-color-white', '#141414');
    root.style.setProperty('--adm-color-weak', '#434343');
    root.style.setProperty('--adm-color-light', '#2f2f2f');
    root.style.setProperty('--adm-border-color', '#434343');
    root.style.setProperty('--adm-font-size-main', '14px');
    root.style.setProperty('--adm-color-text', '#ffffff');
    root.style.setProperty('--adm-color-text-secondary', '#a6a6a6');
    
    // 배경색
    document.body.style.backgroundColor = '#000000';
    document.body.style.color = '#ffffff';
  } else {
    // 라이트 모드 색상 (기본값으로 리셋)
    root.style.setProperty('--adm-color-primary', '#1677ff');
    root.style.setProperty('--adm-color-success', '#00b96b');
    root.style.setProperty('--adm-color-warning', '#ff7a00');
    root.style.setProperty('--adm-color-danger', '#ff3141');
    root.style.setProperty('--adm-color-white', '#ffffff');
    root.style.setProperty('--adm-color-weak', '#f5f5f5');
    root.style.setProperty('--adm-color-light', '#fafafa');
    root.style.setProperty('--adm-border-color', '#eeeeee');
    root.style.setProperty('--adm-font-size-main', '14px');
    root.style.setProperty('--adm-color-text', '#333333');
    root.style.setProperty('--adm-color-text-secondary', '#666666');
    
    // 배경색
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#333333';
  }
};

// 초기 테마 적용
export const initializeTheme = () => {
  const stored = localStorage.getItem('sgsg-theme');
  if (stored) {
    try {
      const { isDarkMode } = JSON.parse(stored);
      applyTheme(isDarkMode);
    } catch (error) {
      console.error('Failed to parse stored theme:', error);
    }
  }
};