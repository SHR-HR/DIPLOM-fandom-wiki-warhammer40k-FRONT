import { WifiOff, Home, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * КОМПОНЕНТ СТРАНИЦЫ ОШИБКИ СЕТЕВОГО СОЕДИНЕНИЯ
 * 
 * Специализированная страница для обработки ошибок сети в Warhammer 40,000 Fandom Wiki:
 * - Отображается при невозможности установить соединение с API сервером
 * - Помогает пользователю диагностировать проблему с подключением
 * - Предоставляет действия для восстановления работы приложения
 * 
 * Используется в случаях:
 * - DNS resolution failed
 * - Network request failed
 * - CORS errors
 * - API server not running
 */
export default function NetworkErrorPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      {/* ОСНОВНОЙ КОНТЕЙНЕР СТРАНИЦЫ ОШИБКИ */}
      <div className="max-w-3xl w-full text-center wh-frame p-6 sm:p-8 relative overflow-hidden">
        
        {/* ДЕКОРАТИВНЫЙ ФОН С ГРАДИЕНТОМ В СТИЛЕ WARHAMMER 40,000 */}
        <div className="absolute -inset-1 bg-gradient-to-br from-brass/10 via-transparent to-mech/10 blur-2xl opacity-40 pointer-events-none" />
        
        {/* ОСНОВНОЕ СОДЕРЖИМОЕ СТРАНИЦЫ */}
        <div className="relative z-10 space-y-5">
          
          {/* ИКОНКА ОШИБКИ СЕТИ В СТИЛИЗОВАННОМ КОНТЕЙНЕРЕ */}
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-brass grid place-items-center">
            <WifiOff className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          {/* ЗАГОЛОВОК ОШИБКИ СЕТИ */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider imperial-aquila">
            Сеть недоступна
          </h1>

          {/* ПОДРОБНОЕ ОПИСАНИЕ ПРОБЛЕМЫ И ВОЗМОЖНЫХ ПРИЧИН */}
          <p className="text-sm sm:text-base text-gray-400">
            Не удалось связаться с сервером. Проверьте интернет или запущен ли API (<code>VITE_API_URL</code>).
          </p>

          {/* ПАНЕЛЬ ДЕЙСТВИЙ ДЛЯ УСТРАНЕНИЯ ПРОБЛЕМЫ */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            
            {/* КНОПКА ПОВТОРНОЙ ПОПЫТКИ ПОДКЛЮЧЕНИЯ */}
            <button
              onClick={() => location.reload()}
              className="px-4 py-2 rounded-xl border-2 border-brass bg-gray-900/60 hover:bg-gray-900 transition"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Обновить
              </span>
            </button>

            {/* ССЫЛКА НА ГЛАВНУЮ СТРАНИЦУ ДЛЯ ПОВТОРНОЙ ЗАГРУЗКИ ПРИЛОЖЕНИЯ */}
            <Link
              to="/"
              className="px-4 py-2 rounded-xl border-2 border-brass bg-mech/80 hover:bg-mech transition"
            >
              <span className="inline-flex items-center gap-2">
                <Home className="w-4 h-4" /> На главную
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}





// Комментарии объясняют:

// 1. Назначение компонента

// Специализированная страница для ошибок сетевого соединения
// Отображается при невозможности подключиться к API серверу
// Помогает диагностировать проблемы с сетевой инфраструктурой

// 2. Контекст использования

// Ошибки DNS resolution (не удается разрешить имя сервера)
// Network request failed (потеряно соединение с интернетом)
// CORS errors (проблемы с политикой безопасности браузера)
// API server not running (серверная часть не запущена)

// 3. Дизайн и пользовательский опыт

// Иконка WifiOff ясно указывает на проблему с соединением
// Подсказка про VITE_API_URL помогает разработчикам быстро диагностировать проблему
// Адаптивный дизайн для всех устройств

// 4. Функциональность восстановления

// Кнопка "Обновить" для повторной попытки загрузки
// Ссылка "На главную" для полной перезагрузки приложения
// Четкие инструкции для пользователя

// 5. Тематическое оформление

// Соответствие общему стилю Warhammer 40,000 Fandom Wiki
// Использование стандартных цветов (brass, mech, gray)
// Градиентные эффекты и специальные CSS-классы

// 6. Технические аспекты

// Интеграция с React Router через компонент Link
// Использование иконок Lucide React для единообразия UI
// Относительные пути для навигации внутри приложения

// Компонент NetworkErrorPage обеспечивает понятное и полезное сообщение об ошибке
// при проблемах с сетевым соединением, помогая пользователям и разработчикам быстро определить
// и решить проблему с подключением к API серверу Warhammer 40,000 Fandom Wiki.





