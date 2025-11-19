// Импорт необходимых модулей из Vite и Node.js
import { defineConfig, loadEnv, type ConfigEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// Создание __dirname для ES модулей (альтернатива CommonJS __dirname)
// Это необходимо потому что мы используем ES модули в конфигурации
const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Экспорт конфигурации Vite как функции, принимающей окружение
export default defineConfig(({ mode }: ConfigEnv) => {
  // Загрузка переменных окружения на основе текущего режима (development/production)
  // process.cwd() - корневая директория проекта
  // "" - префикс для переменных (в данном случае все переменные)
  const env = loadEnv(mode, process.cwd(), "");
  
  // Возврат конфигурации Vite
  return {
    // Плагины Vite
    plugins: [
      // Плагин для поддержки React с быстрой перезагрузкой
      react(),
    ],
    
    // Настройки разрешения модулей
    resolve: {
      // Алиасы для путей импорта
      alias: {
        // Алиас "@" будет указывать на папку src
        "@": path.resolve(__dirname, "./src"),
      },
    },
    
    // Базовый путь для приложения (важно для деплоя в поддиректорию)
    base: env.VITE_BASE_URL || "/",
  };
});






// Подробное объяснение конфигурации Vite:
// Импорты и настройки:
// Импорт из Vite:

// import { defineConfig, loadEnv, type ConfigEnv } from "vite";

// defineConfig - функция для типизированной конфигурации Vite
// loadEnv - загрузка переменных окружения из .env файлов
// ConfigEnv - TypeScript тип для объекта окружения


// Плагин React:

// import react from "@vitejs/plugin-react";

// Обеспечивает поддержку JSX/TSX
// Включает Fast Refresh (горячая перезагрузка)
// Оптимизирован для разработки React приложений


// Path resolution:

// import path from "path";
// import { fileURLToPath } from "url";

// path - Node.js модуль для работы с путями
// fileURLToPath - преобразование URL в пути файловой системы


// Создание __dirname для ES модулей:

// Проблема:

// // В CommonJS модулях __dirname доступен глобально
// // В ES модулях (которые используем) - нет

// // Решение:
// const __dirname = fileURLToPath(new URL(".", import.meta.url));
// // import.meta.url - URL текущего модуля
// // new URL(".", import.meta.url) - URL директории текущего модуля  
// // fileURLToPath() - преобразование file: URL в путь файловой системы


// Функция конфигурации:
// Параметры функции:

// ({ mode }: ConfigEnv) => {
//   // mode - текущий режим сборки: 'development' | 'production' | 'test'
// }

// Загрузка переменных окружения:

// const env = loadEnv(mode, process.cwd(), "");

// mode - определяет какие .env файлы загружать (.env.development, .env.production)
// process.cwd() - текущая рабочая директория (корень проекта)
// "" - префикс для переменных (пустая строка = все переменные)


// Конфигурация Vite:
// Плагины:

// plugins: [react()],

// React плагин обеспечивает:

//   JSX/TSX трансформацию
//   Hot Module Replacement (HMR)
//   Быструю разработку с мгновенными обновлениями


// Resolve Alias:

// resolve: {
//   alias: {
//     "@": path.resolve(__dirname, "./src"),
//   },
// },

// Преимущества алиаса @:

// // Вместо относительных путей:
// import Component from '../../../components/Component';

// // Используем алиас:
// import Component from '@/components/Component';

// Base URL:

// base: env.VITE_BASE_URL || "/",

// Сценарии использования:

// # Для корневого деплоя:
// VITE_BASE_URL=/

// # Для деплоя в поддиректорию:
// VITE_BASE_URL=/warhammer-wiki/

// # В development обычно "/", в production может быть другим



// Для проекта Warhammer 40,000 вики:
// Интеграция с .env файлами:

// // .env.development
// VITE_BASE_URL=/
// VITE_API_URL=http://localhost:8000

// // .env.production  
// VITE_BASE_URL=/warhammer40k/
// VITE_API_URL=https://api.warhammer-wiki.com


// Оптимизации для Warhammer контента:

// // Можно добавить дополнительные настройки:
// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd(), "");
  
//   return {
//     plugins: [react()],
//     resolve: {
//       alias: {
//         "@": path.resolve(__dirname, "./src"),
//       },
//     },
//     base: env.VITE_BASE_URL || "/",
    
//     // Дополнительные настройки для Warhammer проекта:
//     build: {
//       // Увеличить лимит размера бандла для изображений Warhammer
//       chunkSizeWarningLimit: 1000,
//     },
//     server: {
//       // Настройки dev-сервера
//       port: 3000,
//       open: true, // Автоматически открывать браузер
//     },
//   };
// });


// Расширенные возможности:
// Добавление других плагинов:

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import svgr from "vite-plugin-svgr"; // Для SVG как React компонентов

// export default defineConfig({
//   plugins: [
//     react(),
//     svgr(), // Теперь можно: import { ReactComponent as Logo } from './logo.svg'
//   ],
// });


// Оптимизация для продакшена:

// build: {
//   outDir: 'dist',
//   sourcemap: mode !== 'production', // Source maps только в development
//   minify: 'esbuild', // Минификация с помощью esbuild
//   rollupOptions: {
//     output: {
//       // Разделение кода на чанки
//       manualChunks: {
//         vendor: ['react', 'react-dom'],
//         utils: ['lodash', 'axios'],
//       }
//     }
//   }
// }


// Интеграция с TypeScript:
// Типы для переменных окружения:

// // env.d.ts (для автодополнения)
// interface ImportMetaEnv {
//   readonly VITE_API_URL: string;
//   readonly VITE_BASE_URL: string;
//   readonly VITE_AUTH_MODE: string;
// }

// interface ImportMeta {
//   readonly env: ImportMetaEnv;
// }


// Workflow разработки:
// Development сервер:

// npm run dev
// # → Запускает Vite dev server на http://localhost:3000
// # → Автоматически применяет конфигурацию
// # → Горячая перезагрузка при изменениях



// Production сборка:

// npm run build
// # → Создает оптимизированную сборку в dist/
// # → Применяет настройки из .env.production
// # → Использует base URL из VITE_BASE_URL


// Эта конфигурация Vite обеспечивает современную
//  и эффективную среду разработки для фронтенда вики
//   по Warhammer 40,000, с поддержкой горячей перезагрузки,
//    алиасов путей и гибкой настройкой под разные окружения.

