// Импорт основных зависимостей React и связанных библиотек
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import { router } from "@/app/router";
import "@/styles/index.scss";

// Импорт модулей для инициализации приложения
import { api, bootstrapAuthFromStorage } from "@/api/client";
import { initAuth } from "@/features/auth/authSlice";

// ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====

// Восстановление состояния аутентификации из localStorage (если есть сохраненная сессия)
bootstrapAuthFromStorage();

// Установка темы приложения из localStorage или использование темной темы по умолчанию
const theme = (localStorage.getItem("fw_theme") as "dark" | "light") ?? "dark";
document.documentElement.classList.add(theme);

// Инициализация состояния аутентификации в Redux store
store.dispatch(initAuth());

// ===== РАЗРАБОТОЧНЫЕ ЛОГИ =====

// Вывод отладочной информации только в development-режиме
if (import.meta.env.DEV) {
  console.log("API =", import.meta.env.VITE_API_URL);
  console.log("axios base =", api.defaults.baseURL);
}

// ===== РЕНДЕРИНГ ПРИЛОЖЕНИЯ =====

// Создание корневого элемента React и рендеринг приложения
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Provider для подключения Redux store ко всему приложению */}
    <Provider store={store}>
      {/* RouterProvider для настройки маршрутизации React Router */}
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </Provider>
  </React.StrictMode>
);




// Подробное объяснение точки входа приложения:

// Импорты и зависимости:
// Основные библиотеки:

// import React from "react";
// import ReactDOM from "react-dom/client";
// import { RouterProvider } from "react-router-dom";
// import { Provider } from "react-redux";

// Назначение:

// React - основной фреймворк

// ReactDOM - рендеринг в DOM
// React Router - клиентская маршрутизация
// Redux - управление состоянием приложения


// Внутренние модули:

// import { store } from "@/app/store";           // Redux store
// import { router } from "@/app/router";         // Конфигурация маршрутов
// import "@/styles/index.scss";                  // Глобальные стили
// import { api, bootstrapAuthFromStorage } from "@/api/client"; // API клиент
// import { initAuth } from "@/features/auth/authSlice"; // Redux slice для аутентификации


// Процесс инициализации:
// 1. Восстановление аутентификации:

// bootstrapAuthFromStorage();

// Что делает:

// Проверяет localStorage на наличие сохраненной сессии
// Восстанавливает токен аутентификации
// Настраивает axios interceptors для автоматической аутентификации


// 2. Установка темы:

// const theme = (localStorage.getItem("fw_theme") as "dark" | "light") ?? "dark";
// document.documentElement.classList.add(theme);

// Логика работы:

// fw_theme - ключ в localStorage для хранения темы

// as "dark" | "light" - TypeScript утверждение типа

// ?? "dark" - оператор нулевого слияния (значение по умолчанию)

// Добавляет класс к <html> элементу для активации Tailwind dark mode


// 3. Инициализация Redux состояния:

// store.dispatch(initAuth());

// Назначение:

// Инициализирует состояние аутентификации в Redux store
// Может проверять валидность сохраненного токена
// Устанавливает начальное состояние пользователя


// Development-логи:
// Отладочная информация:

// if (import.meta.env.DEV) {
//   console.log("API =", import.meta.env.VITE_API_URL);
//   console.log("axios base =", api.defaults.baseURL);
// }

// Что показывает:

// VITE_API_URL - базовый URL API из переменных окружения
// api.defaults.baseURL - фактический базовый URL axios
// Помогает отладить проблемы с подключением к API



// Рендеринг приложения:
// Создание корневого элемента:

// ReactDOM.createRoot(document.getElementById("root")!)

// createRoot - современный API React 18 для concurrent features
// ! - TypeScript non-null assertion (элемент точно существует)
// root - ID элемента из index.html


// StrictMode:

// <React.StrictMode>

// Преимущества:

// Обнаружение устаревших API
// Предупреждения о небезопасных методах жизненного цикла
// Двойной вызов эффектов для обнаружения side effects


// Redux Provider:

// <Provider store={store}>

// Делает Redux store доступным во всем приложении
// Позволяет использовать useSelector и useDispatch хуки


// React Router:

// <RouterProvider router={router} future={{ v7_startTransition: true }} />

// router - конфигурация маршрутов (созданная с помощью createBrowserRouter)
// v7_startTransition: true - включение concurrent features React Router v7


// Для проекта Warhammer 40,000 вики:
// Специфичная инициализация:

// // Дополнительная инициализация для Warhammer тематики
// const initializeWarhammerApp = () => {
//   // Загрузка начальных данных вселенной Warhammer
//   // Настройка тематических параметров
//   // Инициализация кастомных шрифтов
// };

// // Вызов в main.tsx
// initializeWarhammerApp();


// Темная тема по умолчанию:

// // Темная тема идеально подходит для Warhammer 40,000
// // Создает мрачную, готическую атмосферу вселенной
// const theme = (localStorage.getItem("fw_theme") as "dark" | "light") ?? "dark";


// Обработка ошибок:
// Безопасный рендеринг:

// try {
//   ReactDOM.createRoot(document.getElementById("root")!).render(
//     // ... приложение
//   );
// } catch (error) {
//   console.error("Failed to render app:", error);
//   // Показать fallback UI
//   document.getElementById("root")!.innerHTML = `
//     <div class="error">Failed to load application</div>
//   `;
// }


// Оптимизации:
// Lazy loading для больших частей приложения:

// // В будущем можно добавить:
// const LazyApp = React.lazy(() => import('./App'));

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.Suspense fallback={<div>Loading Warhammer Wiki...</div>}>
//     <StrictMode>
//       <Provider store={store}>
//         <RouterProvider router={router} />
//       </Provider>
//     </StrictMode>
//   </React.Suspense>
// );


// Интеграция с Warhammer тематикой:
// Инициализация тематических настроек:

// // Дополнительная настройка для Warhammer атмосферы
// const initializeWarhammerTheme = () => {
//   // Установка кастомных CSS переменных для цветов Warhammer
//   document.documentElement.style.setProperty('--color-brass', '#B08D57');
//   document.documentElement.style.setProperty('--color-mech', '#C1121F');
  
//   // Добавление тематического класса для глобальных стилей
//   document.documentElement.classList.add('warhammer-theme');
// };

// Этот файл является точкой входа фронтенда вики по 
// Warhammer 40,000 и отвечает за всю начальную инициализацию приложения,
//  включая настройку состояния, тем, маршрутизации 
//  и рендеринга основного интерфейса.




