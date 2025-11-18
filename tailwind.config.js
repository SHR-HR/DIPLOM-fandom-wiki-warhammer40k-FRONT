// Конфигурация Tailwind CSS - утилитарного CSS-фреймворка
export default {
  // Указание путей к файлам, где используются классы Tailwind
  // Tailwind будет анализировать эти файлы и генерировать только используемые стили
  content: [
    "./index.html",          // Основной HTML файл
    "./src/**/*.{ts,tsx}"    // Все TypeScript и React файлы в src
  ],
  
  // Настройка темы - кастомизация дизайн-системы
  theme: {
    // Расширение стандартной темы Tailwind
    extend: {
      // Добавление кастомных цветов для Warhammer 40,000 тематики
      colors: {
        brass: "#B08D57",   // Латунный цвет - для имперской символики, доспехов
        mech: "#C1121F"     // Механический красный - для техники, оружия, крови
      }
    }
  },
  
  // Настройка темного режима
  // "class" - темный режим активируется при наличии класса "dark" на элементе html
  darkMode: "class",
  
  // Подключаемые плагины Tailwind
  // В данный момент пустой, но можно добавить кастомные компоненты
  plugins: []
};



// Подробное объяснение конфигурации Tailwind CSS:
// Секция content:
// Назначение:

// content: [
//   "./index.html",          // Анализирует основной HTML файл
//   "./src/**/*.{ts,tsx}"    // Рекурсивно анализирует все TS/TSX файлы в src
// ]



// Как работает Tree Shaking:

// Tailwind сканирует указанные файлы на наличие классов
// Генерирует только используемые CSS-классы
// Удаляет неиспользуемые стили из финальной сборки

// Пример покрытия:

// src/
// ├── components/
// │   ├── Header.tsx         // ✅ анализируется
// │   └── ArticleCard.tsx    // ✅ анализируется
// ├── pages/
// │   └── Home.tsx          // ✅ анализируется
// └── App.tsx               // ✅ анализируется




// Секция theme.extend.colors:
// Кастомные цвета для Warhammer 40,000:
// Brass (#B08D57) - Латунь:

// /* Использование в компонентах */
// .imperial-badge {
//   background-color: #B08D57;    /* напрямую */
//   @apply bg-brass;              /* через Tailwind класс */
// }

// /* Применение:
// - Золотые/латунные элементы имперской символики
// - Доспехи Space Marines
// - Украшения и геральдика
// */



// Mech (#C1121F) - Механический красный:

// /* Использование в компонентах */
// .weapon-card {
//   border-color: #C1121F;        /* напрямую */
//   @apply border-mech;           /* через Tailwind класс */
// }

// /* Применение:
// - Кроваво-красный цвет для оружия
// - Акценты техники и механизмов
// - Предупреждающие элементы интерфейса
// */


// Секция darkMode: "class":
// Реализация темной темы:

// // Активация темной темы добавлением класса
// document.documentElement.classList.add('dark');

// // В React компоненте можно использовать переключение
// const [isDark, setIsDark] = useState(false);
// useEffect(() => {
//   if (isDark) {
//     document.documentElement.classList.add('dark');
//   } else {
//     document.documentElement.classList.remove('dark');
//   }
// }, [isDark]);


// Использование в CSS:

// /* Light mode (по умолчанию) */
// .card {
//   @apply bg-white text-gray-900;
// }

// /* Dark mode (активируется классом dark) */
// .dark .card {
//   @apply bg-gray-900 text-white;
// }

// /* Или с помощью Tailwind dark: variant */
// <div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
//   Контент
// </div>



// Интеграция с Warhammer 40,000 вики:
// Дополнительные кастомные цвета:

// // Рекомендуемые дополнения для Warhammer тематики:
// colors: {
//   brass: "#B08D57",       // Латунь (текущий)
//   mech: "#C1121F",        // Механический красный (текущий)
  
//   // Дополнительные предложения:
//   imperialGold: "#FFD700",    // Золото Империума
//   chaosPurple: "#800080",     // Пурпурный Хаоса
//   eldarBlue: "#1E90FF",       // Синий Эльдар
//   orkGreen: "#228B22",        // Зеленый Орков
//   necronSilver: "#C0C0C0",    // Серебро Некронов
// }


// Кастомные шрифты:

// theme: {
//   extend: {
//     colors: { /* ... */ },
//     fontFamily: {
//       'warhammer': ['"Trajan Pro"', 'serif'], // Тематический шрифт
//     }
//   }
// }


// Плагины (будущие расширения):
// Полезные плагины для Warhammer вики:

// plugins: [
//   require('@tailwindcss/typography'),    // Красивое оформление текста
//   require('@tailwindcss/forms'),         // Стилизация форм
//   require('@tailwindcss/aspect-ratio'),  // Соотношения сторон для изображений
// ]


// Кастомный плагин для Warhammer UI:

// // plugins/warhammer.js
// const plugin = require('tailwindcss/plugin');

// module.exports = plugin(function({ addComponents }) {
//   addComponents({
//     '.imperial-card': {
//       '@apply bg-gradient-to-b from-gray-800 to-black border-2 border-brass text-white p-4 rounded-lg': '',
//     },
//     '.chaos-card': {
//       '@apply bg-gradient-to-b from-red-900 to-black border-2 border-mech text-red-100 p-4 rounded-lg': '',
//     }
//   });
// });


// Интеграция с React компонентами:
// Пример использования в компоненте:

// // ArticleCard.tsx
// export const ArticleCard: React.FC = () => {
//   return (
//     <div className="bg-white dark:bg-gray-800 border border-brass rounded-lg p-4">
//       <h3 className="text-mech font-bold">Space Marines</h3>
//       <p className="text-gray-700 dark:text-gray-300">
//         Элитные солдаты Империума...
//       </p>
//     </div>
//   );
// };


// Темная тема для Warhammer атмосферы:

// // Тёмная тема идеально подходит для Warhammer 40,000
// // Создает мрачную, готическую атмосферу вселенной
// <div className="dark:bg-black dark:text-brass">
//   {/* Контент в стиле Warhammer */}
// </div>


// Оптимизация для продакшена:
// Размер сборки:
// Tailwind анализирует только указанные в content файлы

// Генерируются только используемые классы

// В production-режиме происходит минификация CSS


// Производительность:
// Быстрая разработка с горячей перезагрузкой

// Оптимизированные стили для продакшена

// Поддержка современных браузеров

// Эта конфигурация Tailwind CSS обеспечивает гибкую и тематически подходящую 
// систему стилей для фронтенда вики по Warhammer 40,000, 
// позволяя легко создавать соответствующий атмосфере вселенной интерфейс.



