// J:\MAIN_DIP-М\FRONT\eslint.config.js

// Импорт необходимых модулей для конфигурации ESLint
import js from '@eslint/js';                    // Базовая конфигурация ESLint для JavaScript
import globals from 'globals';                  // Глобальные переменные (браузер, node и т.д.)
import reactHooks from 'eslint-plugin-react-hooks';      // Правила для React Hooks
import reactRefresh from 'eslint-plugin-react-refresh';  // Поддержка React Fast Refresh
import tseslint from 'typescript-eslint';       // Поддержка TypeScript для ESLint

// Экспорт конфигурации ESLint в новом "flat config" формате
export default tseslint.config(
  // Первая конфигурация: глобальные игнорируемые пути
  { 
    ignores: ['dist']  // Игнорировать папку dist (собранные файлы)
  },
  
  // Вторая конфигурация: настройки для TypeScript/React файлов
  {
    // Расширение базовых конфигураций
    extends: [
      js.configs.recommended,           // Рекомендуемые правила для JavaScript
      ...tseslint.configs.recommended,  // Рекомендуемые правила для TypeScript
    ],
    
    // Применять эти правила только к TypeScript файлам
    files: ['**/*.{ts,tsx}'],
    
    // Настройки языка
    languageOptions: {
      ecmaVersion: 2020,        // Версия ECMAScript (ES2020)
      globals: globals.browser,  // Глобальные переменные браузера (window, document и т.д.)
    },
    
    // Подключаемые плагины
    plugins: {
      'react-hooks': reactHooks,    // Плагин для правил React Hooks
      'react-refresh': reactRefresh, // Плагин для React Fast Refresh
    },
    
    // Кастомные правила
    rules: {
      // Включение рекомендуемых правил для React Hooks
      ...reactHooks.configs.recommended.rules,
      
      // Правило для React Refresh: разрешает экспорт только компонентов
      // (кроме постоянных экспортов - констант, типов и т.д.)
      'react-refresh/only-export-components': [
        'warn',                    // Уровень: предупреждение (не ошибка)
        { allowConstantExport: true },  // Разрешить экспорт констант
      ],
    },
  }
);








// Подробное объяснение конфигурации ESLint:

// Архитектура конфигурации:

// Новый Flat Config формат:

// // Старый формат (.eslintrc.js) заменен на новый flat config
// // Преимущества:
// // - Более простая и понятная структура
// // - Лучшая производительность
// // - Упрощенное расширение конфигураций


// Иерархия конфигураций:

// // Конфигурации применяются последовательно:
// 1. { ignores: ['dist'] }           // Глобальные игнорируемые пути
// 2. { ...typescriptReactConfig }    // Правила для TS/TSX файлов




// Расширенные конфигурации:


// JavaScript Recommended:

// // @eslint/js предоставляет базовые правила:
// // - Синтаксические ошибки
// // - Лучшие практики кодирования
// // - Потенциальные проблемы


// TypeScript Recommended:

// // typescript-eslint добавляет:
// // - TypeScript-специфичные правила
// // - Проверка типов (через парсер TypeScript)
// // - Правила для TypeScript конструкций



// Плагины и их назначение:


// React Hooks:

// // Правила для React Hooks:
// // - hooks-rules-of-hooks: соблюдение правил хуков
// // - hooks-exhaustive-deps: проверка зависимостей useEffect
// // Предотвращает распространенные ошибки при работе с хуками


// React Refresh:

// // Правило only-export-components:
// // - В файлах с JSX разрешает экспорт только React компонентов
// // - allowConstantExport: true - разрешает экспорт констант
// // - Помогает сохранить горячую перезагрузку (HMR) работоспособной


// Настройки языка:
// ECMAScript 2020:

// // Поддержка современных возможностей JavaScript:
// // - Optional chaining: obj?.property
// // - Nullish coalescing: value ?? defaultValue
// // - Dynamic imports: import()
// // - И другие ES2020 фичи


// Глобальные переменные браузера:

// // Доступны без объявления:
// // - window, document, console, localStorage, etc.
// // - navigator, history, location, etc.
// // - fetch, setTimeout, setInterval, etc.


// Для проекта Warhammer 40,000 вики:

// Типичная структура файлов:

// // src/components/ArticleCard.tsx - React компонент с TypeScript
// // src/hooks/useAuth.ts - кастомные хуки
// // src/types/warhammer.ts - TypeScript типы для Warhammer сущностей
// // src/utils/images.ts - утилитарные функции



// Преимущества для разработки:

// 1.TypeScript проверка - типизация для Warhammer сущностей

// 2.React best practices - правильное использование хуков

// 3.Hot reload сохранение - быстрая разработка с React Refresh

// 4.Единый кодстайл - согласованность в команде





// Интеграция с инструментами разработки:


// VS Code:

// // .vscode/settings.json
// {
//   "eslint.useFlatConfig": true,  // Использовать новый flat config
//   "eslint.validate": ["typescript", "typescriptreact"]
// }


// Package.json скрипты:

// {
//   "scripts": {
//     "lint": "eslint .",           // Проверка всех файлов
//     "lint:fix": "eslint . --fix"  // Автоматическое исправление
//   }
// }




// Дополнительные возможности:


// Добавление Prettier:


// // Можно интегрировать с Prettier для форматирования
// import prettier from 'eslint-config-prettier';

// export default tseslint.config(
//   // ... существующая конфигурация
//   prettier,  // Отключает правила ESLint которые конфликтуют с Prettier
// );



// Кастомные правила для Warhammer проекта:


// rules: {
//   // ... существующие правила
  
//   // Дополнительные правила специфичные для проекта
//   '@typescript-eslint/naming-convention': [
//     'warn',
//     { 
//       selector: 'interface', 
//       format: ['PascalCase'],
//       prefix: ['I']  // Интерфейсы начинаются с I: ICharacter, IFaction
//     }
//   ]
// }

// Эта конфигурация ESLint обеспечивает профессиональную настройку линтера для фронтенд-проекта 
// вики по Warhammer 40,000, сочетая современные стандарты JavaScript/TypeScript 
// с лучшими практиками React разработки.




