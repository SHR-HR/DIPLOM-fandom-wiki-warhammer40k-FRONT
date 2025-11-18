// Конфигурация PostCSS - инструмента для преобразования CSS с помощью JavaScript
export default {
  plugins: {
    // Подключение плагина Tailwind CSS
    tailwindcss: {},
    
    // Подключение плагина Autoprefixer
    autoprefixer: {},
  },
};



// Подробное объяснение конфигурации PostCSS:
// Что такое PostCSS?
// PostCSS - это инструмент для преобразования CSS с помощью JavaScript-плагинов. Он позволяет:

// Автоматически добавлять вендорные префиксы

// Использовать будущие возможности CSS сегодня

// Оптимизировать и минифицировать CSS

// Работать с современными CSS-фреймворками




// Плагины в конфигурации:
// Tailwind CSS:

// tailwindcss: {},

// Назначение:

// Обрабатывает директивы Tailwind (@tailwind, @apply, @layer)
// Генерирует утилитарные классы на основе конфигурации
// Удаляет неиспользуемые стили в production-сборке


// Как работает:

// Назначение:

// Обрабатывает директивы Tailwind (@tailwind, @apply, @layer)
// Генерирует утилитарные классы на основе конфигурации
// Удаляет неиспользуемые стили в production-сборке


// Как работает:

// /* Исходный CSS с директивами Tailwind */
// @tailwind base;
// @tailwind components;
// @tailwind utilities;

// /* Преобразуется в готовые CSS классы */
// .btn { 
//   @apply bg-blue-500 text-white py-2 px-4 rounded;
// }


// Autoprefixer:
// autoprefixer: {},



// Назначение:
// Автоматически добавляет вендорные префиксы к CSS свойствам
// Обеспечивает кросс-браузерную совместимость
// Использует данные Can I Use для определения необходимых префиксов


// Пример преобразования:

// /* Исходный CSS */
// .container {
//   display: flex;
//   transform: rotate(45deg);
// }

// /* После Autoprefixer */
// .container {
//   display: -webkit-box;
//   display: -ms-flexbox;
//   display: flex;
//   -webkit-transform: rotate(45deg);
//           transform: rotate(45deg);
// }


// Интеграция с проектом Warhammer 40,000 вики:
// Для Tailwind CSS:

// // tailwind.config.js (сопутствующий файл)
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         // Кастомные цвета Warhammer тематики
//         'imperial-gold': '#d4af37',
//         'chaos-red': '#8b0000',
//         'eldar-purple': '#800080',
//       }
//     },
//   },
// }



// Процесс сборки CSS:

// Исходные файлы → PostCSS → Готовый CSS
//     ↓              ↓           ↓
// style.css → Tailwind + Autoprefixer → style.processed.css



// Преимущества для фронтенда:
// Разработка:
// Быстрое прототипирование - утилиты Tailwind

// Кросс-браузерность - автоматические префиксы

// Оптимизация - удаление неиспользуемого CSS


// Производительность:
// Tree shaking - только используемые стили попадают в сборку

// Минификация - уменьшение размера CSS файлов

// Современный CSS - использование возможностей будущего


// Работа с Vite:
// Автоматическое применение:
// Vite автоматически обнаруживает postcss.config.js

// Применяет PostCSS ко всем CSS файлам в проекте

// Работает как в dev-сервере, так и при сборке


// В development-режиме:
// Быстрая пересборка стилей при изменениях

// Source maps для отладки

// Hot reload для CSS


// Расширение конфигурации:
// Дополнительные плагины:

// export default {
//   plugins: {
//     tailwindcss: {},
//     autoprefixer: {},
    
//     // Дополнительные плагины при необходимости
//     'postcss-nested': {},        // Вложенность CSS (как в Sass)
//     'cssnano': {                 // Минификация CSS
//       preset: 'default',
//     },
//   },
// }


// Кастомные настройки Autoprefixer:

// export default {
//   plugins: {
//     tailwindcss: {},
//     autoprefixer: {
//       // Настройка поддержки браузеров
//       overrideBrowserslist: [
//         '>1%',
//         'last 2 versions',
//         'not dead',
//       ],
//     },
//   },
// }


// Для Warhammer 40,000 тематики:
// Кастомные стили:

// /* В src/index.css */
// @tailwind base;
// @tailwind components;
// @tailwind utilities;

// /* Кастомные компоненты Warhammer */
// .imperial-card {
//   @apply bg-gradient-to-b from-gray-800 to-black border border-imperial-gold text-white;
// }

// .chaos-card {
//   @apply bg-gradient-to-b from-red-900 to-black border border-chaos-red text-red-100;
// }

// Эта конфигурация PostCSS обеспечивает современную и 
// эффективную обработку CSS для фронтенда вики по Warhammer 40,000, 
// сочетая мощь Tailwind CSS с надежностью Autoprefixer для кросс-браузерной совместимости.




