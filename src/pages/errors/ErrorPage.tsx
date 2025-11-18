import { useMemo } from "react";
import { Link, useParams, useRouteError } from "react-router-dom";
import {
  Home, RefreshCw, ShieldAlert, Zap, WifiOff, Lock, Ban, Bug, Construction, Compass
} from "lucide-react";

/**
 * ТИПЫ ИЗВЕСТНЫХ КОДОВ ОШИБОК
 * 
 * Определяет перечень обрабатываемых HTTP статус кодов
 * Каждый код имеет уникальную иконку, заголовок и описание
 */
type Known = 401 | 403 | 404 | 409 | 418 | 429 | 500 | 502 | 503 | 504;

/**
 * ФУНКЦИЯ НОРМАЛИЗАЦИИ КОДА ОШИБКИ
 * 
 * Преобразует неизвестный код ошибки в стандартизированный формат:
 * - Проверяет что код является числом
 * - Проверяет что код входит в список известных ошибок
 * - Возвращает 500 (Internal Server Error) для неизвестных кодов
 */
function norm(x: unknown): Known | 500 {
  const n = Number(x);
  const set: Known[] = [401, 403, 404, 409, 418, 429, 500, 502, 503, 504];
  return Number.isFinite(n) && set.includes(n as Known) ? (n as Known) : 500;
}

/**
 * БИБЛИОТЕКА ИКОНОК ДЛЯ КАЖДОГО ТИПА ОШИБКИ
 * 
 * Визуальное представление различных типов ошибок
 * Соответствует тематике Warhammer 40,000:
 * - Lock (401) - требуется доступ
 * - Ban (403) - доступ запрещен
 * - Compass (404) - путь не найден
 * - ShieldAlert (409) - конфликт
 * - Bug (418, 500, 502) - технические ошибки
 * - Zap (429) - превышение лимита
 * - Construction (503) - сервис недоступен
 * - WifiOff (504) - проблемы соединения
 */
const icon: Record<Known, JSX.Element> = {
  401: <Lock className="w-8 h-8 sm:w-10 sm:h-10" />,
  403: <Ban className="w-8 h-8 sm:w-10 sm:h-10" />,
  404: <Compass className="w-8 h-8 sm:w-10 sm:h-10" />,
  409: <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />,
  418: <Bug className="w-8 h-8 sm:w-10 sm:h-10" />,
  429: <Zap className="w-8 h-8 sm:w-10 sm:h-10" />,
  500: <Bug className="w-8 h-8 sm:w-10 sm:h-10" />,
  502: <Bug className="w-8 h-8 sm:w-10 sm:h-10" />,
  503: <Construction className="w-8 h-8 sm:w-10 sm:h-10" />,
  504: <WifiOff className="w-8 h-8 sm:w-10 sm:h-10" />,
};

/**
 * БИБЛИОТЕКА ЗАГОЛОВКОВ ОШИБОК
 * 
 * Краткие понятные заголовки для каждого типа ошибки
 * Соответствуют стандартам HTTP и легко понимаются пользователями
 */
const title: Record<Known, string> = {
  401: "Требуется авторизация",
  403: "Доступ запрещён",
  404: "Страница не найдена",
  409: "Конфликт запроса",
  418: "Я — чайник",
  429: "Слишком много запросов",
  500: "Внутренняя ошибка сервера",
  502: "Плохой шлюз",
  503: "Сервис временно недоступен",
  504: "Таймаут шлюза",
};

/**
 * БИБЛИОТЕКА ПОЯСНЕНИЙ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ
 * 
 * Подробные описания на русском языке с элементами тематики Warhammer 40,000
 * Объясняют причину ошибки и возможные действия для её решения
 */
const hint: Record<Known, string> = {
  401: "Войдите в аккаунт, чтобы продолжить.",
  403: "У вас нет прав для доступа к этому ресурсу.",
  404: "Похоже, вы забрели в Око Ужаса. Вернёмся на главную?",
  409: "Обновите страницу или повторите действие позже.",
  418: "Попробуйте иначе сформулировать запрос.",
  429: "Сделайте паузу и повторите попытку.",
  500: "Мы уже вызвали техножрецов. Попробуйте позже.",
  502: "Шлюз ответил некорректно. Обновите страницу.",
  503: "Идут профилактические ритуалы. Повторите позже.",
  504: "Сервер слишком долго отвечал. Обновите страницу.",
};

/**
 * КОМПОНЕНТ СТРАНИЦЫ ОШИБКИ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Универсальный компонент для отображения различных типов ошибок:
 * - Обрабатывает ошибки маршрутизации (React Router)
 * - Отображает соответствующие HTTP статус коды
 * - Предоставляет понятные пользователю сообщения
 * - Включает действия для решения проблемы
 */
export default function ErrorPage() {
  // Получаем параметры URL и объект ошибки из React Router
  const params = useParams<{ code?: string }>();
  const err = useRouteError() as any;

  /**
   * ОПРЕДЕЛЕНИЕ КОДА ОШИБКИ С ПРИОРИТЕТАМИ
   * 
   * useMemo оптимизирует вычисление кода ошибки:
   * Приоритет 1: код из параметров URL (/errors/404)
   * Приоритет 2: код из объекта ошибки React Router
   * Приоритет 3: код из ответа сервера (err.response.status)
   * 
   * Нормализация гарантирует валидный код даже при некорректных данных
   */
  const code = useMemo<Known | 500>(() => {
    if (params.code) return norm(params.code);
    const status = err?.status ?? err?.statusCode ?? err?.response?.status;
    return norm(status);
  }, [params.code, err]);

  /**
   * ИЗВЛЕЧЕНИЕ ДЕТАЛЬНОГО СООБЩЕНИЯ ОБ ОШИБКЕ
   * 
   * Многоуровневый поиск сообщения об ошибке:
   * 1. Данные ошибки (err.data.message)
   * 2. Статус текст (err.statusText)
   * 3. Общее сообщение (err.message)
   * 4. Пустая строка если сообщение не найдено
   */
  const message =
    err?.data?.message ??
    err?.statusText ??
    err?.message ??
    "";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      {/* КОНТЕЙНЕР СТРАНИЦЫ ОШИБКИ С ТЕМАТИЧЕСКИМ ДИЗАЙНОМ */}
      <div className="max-w-3xl w-full text-center wh-frame p-6 sm:p-8 relative overflow-hidden">
        
        {/* ДЕКОРАТИВНЫЙ ГРАДИЕНТНЫЙ ФОН */}
        <div className="absolute -inset-1 bg-gradient-to-br from-brass/10 via-transparent to-mech/10 blur-2xl opacity-40 pointer-events-none" />
        
        {/* ОСНОВНОЕ СОДЕРЖИМОЕ СТРАНИЦЫ */}
        <div className="relative z-10 space-y-5">
          
          {/* ИКОНКА ОШИБКИ В СТИЛИЗОВАННОМ КОНТЕЙНЕРЕ */}
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-brass grid place-items-center">
            {icon[code]}
          </div>

          {/* ЗАГОЛОВОК С КОДОМ И ОПИСАНИЕМ ОШИБКИ */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider imperial-aquila">
            {code} — {title[code]}
          </h1>

          {/* ДОПОЛНИТЕЛЬНОЕ СООБЩЕНИЕ ОБ ОШИБКЕ (ЕСЛИ ЕСТЬ) */}
          {message && (
            <p className="text-sm sm:text-base text-gray-300/90">{String(message)}</p>
          )}

          {/* ПОЯСНИТЕЛЬНЫЙ ТЕКСТ ДЛЯ ПОЛЬЗОВАТЕЛЯ */}
          <p className="text-sm sm:text-base text-gray-400">{hint[code]}</p>

          {/* ПАНЕЛЬ ДЕЙСТВИЙ ДЛЯ РЕШЕНИЯ ПРОБЛЕМЫ */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            
            {/* КНОПКА ПЕРЕЗАГРУЗКИ СТРАНИЦЫ */}
            <button
              onClick={() => location.reload()}
              className="px-4 py-2 rounded-xl border-2 border-brass bg-gray-900/60 hover:bg-gray-900 transition"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Обновить
              </span>
            </button>

            {/* ССЫЛКА НА ГЛАВНУЮ СТРАНИЦУ */}
            <Link
              to="/"
              className="px-4 py-2 rounded-xl border-2 border-brass bg-mech/80 hover:bg-mech transition"
            >
              <span className="inline-flex items-center gap-2">
                <Home className="w-4 h-4" /> На главную
              </span>
            </Link>
          </div>

          {/* ТЕХНИЧЕСКАЯ ПОДСКАЗКА ДЛЯ ПОВТОРЯЮЩИХСЯ ОШИБОК */}
          <div className="pt-3 text-xs text-gray-500">
            Если проблема повторяется — проверьте подключение к API и авторизацию.
          </div>
        </div>
      </div>
    </div>
  );
}




// Комментарии объясняют:

// 1. Архитектуру системы обработки ошибок

// Универсальный компонент для всех типов HTTP ошибок
// Интеграцию с React Router для обработки ошибок маршрутизации
// Многоуровневую систему определения кода ошибки

// 2. Систему классификации ошибок

// Поддержку стандартных HTTP статус кодов
// Нормализацию неизвестных кодов в стандартный формат
// Категоризацию ошибок по типам (клиентские, серверные, авторизация)

// 3. Пользовательский интерфейс ошибок

// Визуальное представление через иконки Lucide React
// Тематические сообщения в стиле Warhammer 40,000
// Адаптивный дизайн для всех устройств

// 4. Логику определения ошибки

// Приоритеты источников данных (URL параметры → объект ошибки → ответ сервера)
// Защиту от некорректных данных через нормализацию
// Мемоизацию вычислений для оптимизации

// 5. Элементы пользовательского опыта

// Понятные сообщения на русском языке
// Практические действия для решения проблемы
// Декоративные элементы в тематике вселенной

// 6. Тематическое оформление

// Цветовую схему (brass, mech, gray)
// Специальные классы (wh-frame, imperial-aquila)
// Градиенты и эффекты соответствующие эстетике Warhammer 40,000

// Компонент ErrorPage обеспечивает единообразное и тематически соответствующее
// отображение ошибок throughout всего приложения Warhammer 40,000 Fandom Wiki, 
// улучшая пользовательский опыт даже в ситуациях сбоев.




