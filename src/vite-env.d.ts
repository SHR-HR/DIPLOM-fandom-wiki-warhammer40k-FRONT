// Ссылка на типы Vite для автодополнения и проверки типов
/// <reference types="vite/client" />

// Объявление интерфейса для переменных окружения Vite
// Это обеспечивает TypeScript проверку для import.meta.env
interface ImportMetaEnv {
  // Базовый URL API бэкенда
  readonly VITE_API_URL: string
  
  // Режим аутентификации: 'local' | 'basic' | 'hybrid'
  readonly VITE_AUTH_MODE: string
  
  // Базовый URL для деплоя в поддиректорию (опционально)
  readonly VITE_BASE_URL?: string
  
  // Учетные данные для автоматической аутентификации (опционально, только для development)
  readonly VITE_BASIC_USER?: string
  readonly VITE_BASIC_PASS?: string
}

// Расширение стандартного интерфейса ImportMeta для Vite
interface ImportMeta {
  readonly env: ImportMetaEnv
}



// Подробное объяснение файла деклараций типов:


// Назначение файла:
// Этот файл предоставляет TypeScript типам для переменных окружения Vite, что позволяет:


// Автодополнение в IDE при работе с import.meta.env
// Проверку типов во время компиляции
// Защиту от опечаток в именах переменных
// Документацию доступных переменных окружения



// Директива тройной ссылки:

// /// <reference types="vite/client" />

// Что это делает:

// Подключает типы из пакета vite/client
// Предоставляет базовые типы для Vite
// Включает тип ImportMeta и ImportMetaEnv


// Расширение интерфейса ImportMetaEnv:

// VITE_API_URL:

// readonly VITE_API_URL: string


// Использование в коде:

// // TypeScript знает что это строка и существует
// const apiUrl = import.meta.env.VITE_API_URL;

// // Автодополнение работает в VS Code
// // Ошибка если переменная не определена


// VITE_AUTH_MODE:

// readonly VITE_AUTH_MODE: string

// Рекомендуемое уточнение типа:

// // Можно сделать более строгую типизацию:
// interface ImportMetaEnv {
//   readonly VITE_AUTH_MODE: 'local' | 'basic' | 'hybrid'
//   // ... другие переменные
// }


// Опциональные переменные:

// readonly VITE_BASE_URL?: string
// readonly VITE_BASIC_USER?: string  
// readonly VITE_BASIC_PASS?: string

// ? означает что переменные могут отсутствовать - это важно для переменных, 
// которые есть только в development.



// Для проекта Warhammer 40,000 вики:
// Полная типизация с учетом всех .env файлов:

// interface ImportMetaEnv {
//   // Обязательные переменные (из .env.example)
//   readonly VITE_API_URL: string
//   readonly VITE_AUTH_MODE: 'local' | 'basic' | 'hybrid'
  
//   // Опциональные переменные (могут быть в .env.local)
//   readonly VITE_BASE_URL?: string
//   readonly VITE_BASIC_USER?: string
//   readonly VITE_BASIC_PASS?: string
  
//   // Переменные для разных окружений
//   readonly VITE_DEBUG?: string
//   readonly VITE_LOG_LEVEL?: string
// }

// Использование в компонентах Warhammer:

// // src/utils/api.ts
// export const API_BASE_URL = import.meta.env.VITE_API_URL;

// // src/hooks/useAuth.ts
// export const AUTH_MODE = import.meta.env.VITE_AUTH_MODE;

// // src/components/App.tsx
// export const App: React.FC = () => {
//   const baseUrl = import.meta.env.VITE_BASE_URL || '/';
  
//   return (
//     <Router basename={baseUrl}>
//       {/* Warhammer компоненты */}
//     </Router>
//   );
// };




// Преимущества строгой типизации:
// Обнаружение ошибок на этапе компиляции:

// // Ошибка TypeScript: Свойство 'VITE_UNKNOWN_VAR' не существует
// const unknown = import.meta.env.VITE_UNKNOWN_VAR;

// // Ошибка TypeScript: VITE_API_URL возможно 'undefined'
// const apiUrl: string = import.meta.env.VITE_API_URL; // Нужно проверить!



// Правильное использование:

// // Безопасное использование с проверкой
// const apiUrl = import.meta.env.VITE_API_URL;
// if (!apiUrl) {
//   throw new Error('VITE_API_URL is not defined');
// }

// // Или с значением по умолчанию
// const authMode = import.meta.env.VITE_AUTH_MODE || 'hybrid';



// Расширение для дополнительной функциональности:
// Для кастомных переменных Warhammer:

// interface ImportMetaEnv {
//   // ... существующие переменные
  
//   // Дополнительные переменные для Warhammer тематики
//   readonly VITE_APP_TITLE?: string
//   readonly VITE_DEFAULT_FACTION?: string
//   readonly VITE_ENABLE_DARK_MODE?: string
// }


// Строгая типизация с литеральными типами:

// interface ImportMetaEnv {
//   readonly VITE_API_URL: string
//   readonly VITE_AUTH_MODE: 'local' | 'basic' | 'hybrid'
//   readonly VITE_BASE_URL?: `/${string}` // Должен начинаться с /
// }


// Интеграция с Vite конфигурацией:
// Согласованность с vite.config.ts:

// // vite.config.ts использует те же переменные
// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd(), "");
  
//   return {
//     base: env.VITE_BASE_URL || "/", // TypeScript знает что это строка
//     // ... другие настройки
//   };
// });


// Best practices:
// Проверка обязательных переменных:

// // src/utils/env.ts
// export const getRequiredEnv = (key: keyof ImportMetaEnv): string => {
//   const value = import.meta.env[key];
//   if (!value) {
//     throw new Error(`Environment variable ${key} is required but not set`);
//   }
//   return value;
// };

// // Использование:
// const apiUrl = getRequiredEnv('VITE_API_URL');


// Dev/Prod различия:

// // Переменные с ? подходят для разных окружений
// const isDevelopment = import.meta.env.DEV;

// if (isDevelopment && import.meta.env.VITE_BASIC_USER) {
//   // Автологин только в development
//   autoLogin(import.meta.env.VITE_BASIC_USER, import.meta.env.VITE_BASIC_PASS);
// }

// Этот файл деклараций типов обеспечивает полную 
// TypeScript поддержку для переменных окружения 
// в проекте Warhammer 40,000 вики, предотвращая 
// распространенные ошибки и улучшая developer experience с автодополнением и проверкой типов.


