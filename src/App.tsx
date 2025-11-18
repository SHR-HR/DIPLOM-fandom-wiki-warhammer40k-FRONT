// J:\MAIN_DIP-М\FRONT\src\App.tsx

import { useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import ThemeToggle from "@/features/ui/ThemeToggle";
import { Toaster } from "react-hot-toast";
import { Home, PlusCircle, User, Shield, UserPlus } from "lucide-react";
import { resetHome } from "@/features/ui/uiSlice";

// Основной компонент приложения - корневой layout
export default function App() {
  // Получение состояния из Redux store
  const theme = useAppSelector((s) => s.ui.theme);        // Текущая тема (dark/light)
  const isAuthed = useAppSelector((s) => s.auth.isAuthed); // Статус аутентификации пользователя
  const location = useLocation();                         // Текущий путь для подсветки активной ссылки
  const dispatch = useAppDispatch();                      // Dispatch для отправки actions

  // Централизованное управление классами темы на элементе <html>
  // Это важно для корректной работы Tailwind CSS dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  // Базовые классы для навигационных ссылок
  const linkBase =
    "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg transition text-sm sm:text-base";
  
  // Стили для неактивных ссылок
  const idle =
    "text-gray-900 hover:bg-slate-200 dark:text-gray-300 dark:hover:bg-gray-800";

  // Обработчик перехода на главную страницу - сбрасывает состояние home
  const handleGoHome = () => {
    dispatch(resetHome());
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== HEADER - Шапка приложения ===== */}
      <header
        className="
          sticky top-0 z-50 border-b-4 border-brass           /* Липкая шапка с латунной границей */
          bg-white/90 text-gray-900                          /* Светлый фон с прозрачностью */
          dark:bg-black dark:text-gray-100                   /* Темный фон для dark mode */
          backdrop-blur-sm                                   /* Размытие фона для стеклянного эффекта */
          shadow-[0_4px_40px_rgba(0,0,0,0.06)]              /* Тень для светлой темы */
          dark:shadow-[0_4px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(139,0,0,0.3)] /* Тень для темной темы с красным свечением */
        "
      >
        {/* Обертка для создания контекста позиционирования */}
        <div className="relative">
          {/* Декоративные градиентные фоны, адаптивные к теме */}
          <div
            className="
              absolute inset-0
              bg-gradient-to-b from-white via-white/80 to-white        /* Градиент для светлой темы */
              dark:from-black dark:via-zinc-950 dark:to-black         /* Градиент для темной темы */
              opacity-95
            "
          />
          {/* Декоративная линия внизу шапки */}
          <div
            className="
              absolute bottom-0 left-0 right-0 h-px
              bg-gradient-to-r from-transparent via-mech to-transparent  /* Красная градиентная линия */
              opacity-50
            "
          />
          
          {/* Основное содержимое шапки */}
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 relative z-10">
            <nav className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Логотип и ссылка на главную */}
              <Link
                to="/"
                onClick={handleGoHome}
                className="flex items-center gap-2 text-lg sm:text-xl font-bold text-brass hover:text-yellow-400 transition"
              >
                <Shield className="w-5 h-5 sm:w-6 sm:h-6" />  {/* Иконка щита - символ Warhammer */}
                <span className="hidden md:inline">Fandom Wiki</span>  {/* Полное название на больших экранах */}
                <span className="md:hidden">FW</span>          {/* Сокращение на мобильных */}
              </Link>

              {/* Навигационные ссылки */}
              <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
                {/* Ссылка на главную страницу */}
                <Link
                  to="/"
                  onClick={handleGoHome}
                  className={`${linkBase} ${
                    location.pathname === "/" ? "bg-brass text-black" : idle  /* Подсветка активной ссылки */
                  }`}
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden lg:inline">Главная</span>  {/* Текст скрыт на маленьких экранах */}
                </Link>

                {/* Ссылка "Создать" - показывается только авторизованным пользователям */}
                {isAuthed && (
                  <Link
                    to="/new"
                    className={`${linkBase} ${
                      location.pathname === "/newArticle"
                        ? "bg-brass text-black"
                        : idle
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden lg:inline">Создать</span>
                  </Link>
                )}

                {/* Условный рендеринг для авторизованных/неавторизованных пользователей */}
                {isAuthed ? (
                  // Для авторизованных - ссылка на профиль
                  <Link
                    to="/profile"
                    className={`${linkBase} ${
                      location.pathname === "/profile"
                        ? "bg-brass text-black"
                        : idle
                    }`}
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden lg:inline">Профиль</span>
                  </Link>
                ) : (
                  // Для неавторизованных - ссылки на вход и регистрацию
                  <>
                    <Link
                      to="/profile"
                      className={`${linkBase} ${
                        location.pathname === "/profile"
                          ? "bg-brass text-black"
                          : idle
                      }`}
                    >
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden lg:inline">Вход</span>
                    </Link>
                    <Link
                      to="/register"
                      className={`${linkBase} ${
                        location.pathname === "/register"
                          ? "bg-brass text-black"
                          : idle
                      }`}
                    >
                      <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden lg:inline">Регистрация</span>
                    </Link>
                  </>
                )}

                {/* Компонент переключения темы */}
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT - Основное содержимое ===== */}
      {/* Outlet рендерит дочерние маршруты React Router */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ===== FOOTER - Подвал приложения ===== */}
      <footer
        className="
          border-t-4 border-brass mt-auto relative           /* Латунная граница сверху */
          bg-white/95 text-gray-900                         /* Светлый фон */
          dark:bg-black dark:text-gray-100                  /* Темный фон */
          shadow-[0_-4px_40px_rgba(0,0,0,0.05)]            /* Тень для светлой темы */
          dark:shadow-[0_-4px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(139,0,0,0.3)] /* Тень для темной темы */
        "
      >
        {/* Декоративные градиенты */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-t from-white via-white/85 to-white    /* Градиент для светлой темы */
            dark:from-black dark:via-zinc-950 dark:to-black     /* Градиент для темной темы */
            opacity-95
          "
        />
        {/* Декоративная линия сверху подвала */}
        <div
          className="
            absolute top-0 left-0 right-0 h-px
            bg-gradient-to-r from-transparent via-mech to-transparent  /* Красная градиентная линия */
            opacity-50
          "
        />
        
        {/* Содержимое подвала */}
        <div className="container mx-auto px-4 py-6 sm:py-8 text-center relative z-10">
          {/* Декоративный разделитель с названием */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-brass"></div>
            <p className="text-sm sm:text-base text-brass font-bold tracking-widest">
              FANDOM WIKI
            </p>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-brass"></div>
          </div>
          
          {/* Описание проекта */}
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Warhammer 40,000 Encyclopedia
          </p>
          
          {/* Знаменитая цитата из вселенной Warhammer 40,000 */}
          <p className="text-xs sm:text-sm mt-3 text-mech font-bold tracking-wider drop-shadow-[0_0_10px_rgba(193,18,31,0.5)]">
            «В МРАЧНОЙ ТЬМЕ ДАЛЕКОГО БУДУЩЕГО ЕСТЬ ТОЛЬКО ВОЙНА»
          </p>
          
          {/* Информация об авторах проекта */}
          <div className="mt-4 text-xs text-gray-700 dark:text-gray-500">
            СТУДЕНТ-РОМАН ШАУНИН-       ⚔ FOR THE EMPEROR ⚔       -ИГОРЬ СОКОЛОВ-ПРЕПОДАВАТЕЛЬ
          </div>
          
          {/* Копирайт и информация о курсе */}
          <div className="mt-4 text-xs text-gray-700 dark:text-gray-500">
            КАРАГАНДА-JSE-242-2025 ©
          </div>
        </div>
      </footer>

      {/* ===== TOAST NOTIFICATIONS - Система уведомлений ===== */}
      <Toaster
        position="top-right"  // Позиция уведомлений
        toastOptions={{
          duration: 3000,     // Длительность показа
          style: {
            background: "#1f2937",  // Темный фон
            color: "#fff",          // Белый текст
            border: "2px solid #B08D57",  // Латунная граница
          },
        }}
      />
    </div>
  );
}



// Подробное объяснение архитектуры компонента App:

// Структура компонента:

// 1. State Management:
// useAppSelector - для доступа к состоянию Redux (тема, аутентификация)
// useAppDispatch - для отправки actions в Redux store
// useLocation - для определения текущего маршрута React Router


// 2. Theme System:

// useEffect(() => {
//   document.documentElement.classList.toggle("dark", theme === "dark");
//   document.documentElement.classList.toggle("light", theme === "light");
// }, [theme]);


// Важность: Синхронизация класса темы на <html> элементе критична для:

// Tailwind CSS dark mode (dark:... классы)
// Кастомных CSS переменных
// Согласованного отображения во всем приложении


// Навигационная система:

// Адаптивный дизайн:
// Mobile-first подход с прогрессивным улучшением
// Скрытие текста на маленьких экранах (hidden lg:inline)
// Иконки Lucide для универсального понимания


// Условный рендеринг:

// {isAuthed ? (
//   // Авторизованный пользователь
//   <Link to="/profile">Профиль</Link>
// ) : (
//   // Неавторизованный пользователь
//   <>
//     <Link to="/profile">Вход</Link>
//     <Link to="/register">Регистрация</Link>
//   </>
// )}


// Визуальный дизайн для Warhammer 40,000:

// Цветовая палитра:
// Brass (#B08D57) - латунь для имперской эстетики
// Mech (#C1121F) - кроваво-красный для акцентов
// Темная тема по умолчанию - соответствует мрачной атмосфере вселенной


// Декоративные элементы:

// /* Градиентные границы */
// border-b-4 border-brass

// /* Стеклянный эффект */
// backdrop-blur-sm bg-white/90

// /* Тени с красным свечением в dark mode */
// dark:shadow-[0_4px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(139,0,0,0.3)]


// Система уведомлений:

// React Hot Toast:
// Позиция top-right - стандартное расположение
// Длительность 3 секунды - оптимальное время для чтения
// Стилизация в тематике Warhammer - темный фон с латунной границей


// Для проекта Warhammer 40,000 вики:

// Тематические элементы:
// Иконка Shield - символизирует защиту и имперскую мощь
// Цитата "В мрачной тьме далекого будущего есть только война" - ключевая фраза вселенной
// Боевая символика ⚔ - мечи как элемент дизайна


// Адаптация под контент:

// Темная тема усиливает атмосферу готического научного фэнтези
// Латунные акценты отсылают к имперской эстетике
// Красные элементы символизируют кровь и войну


// Производительность и доступность:

// Оптимизации:
// Sticky header - навигация всегда доступна
// Flexbox layout - эффективное использование пространства
// Responsive design - работа на всех устройствах

// Доступность:
// Семантические теги (header, main, footer)
// Четкая навигация с подсветкой активной страницы
// Адаптивные тексты - читаемость на всех экранах


// Этот компонент служит корневым layout'ом для всего 
// приложения вики по Warhammer 40,000, обеспечивая единообразный 
// интерфейс, навигацию и визуальную идентичность, соответствующую тематике вселенной.




