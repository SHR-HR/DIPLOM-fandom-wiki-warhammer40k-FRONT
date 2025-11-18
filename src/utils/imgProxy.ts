// J:\MAIN_DIP-М\FRONT\src\utils\imgProxy.ts

/**
 * СИСТЕМА ПРОКСИРОВАНИЯ И ОБРАБОТКИ ИЗОБРАЖЕНИЙ ДЛЯ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Этот модуль обеспечивает безопасную загрузку и отображение изображений из различных источников,
 * включая локальные файлы, внешние CDN и специализированные сервисы с обходом ограничений
 */

import type React from "react";
import { api } from "@/api/client";

/** 
 * SVG-ЗАГЛУШКА ДЛЯ ИЗОБРАЖЕНИЙ 16:9
 * 
 * Используется для предотвращения "прыгания" карточек статей во время загрузки изображений
 * Соответствует тематике Warhammer 40,000 (темные тона с латунными акцентами)
 */
export const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'>
      <defs>
        <!-- Темный градиентный фон в стиле Warhammer -->
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#0b0f19'/>
          <stop offset='100%' stop-color='#0a0d14'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <!-- Текст-заглушка с латунным цветом -->
      <text x='50%' y='50%' fill='#b48d57' font-size='22' font-family='system-ui,Segoe UI,Arial,sans-serif' dominant-baseline='middle' text-anchor='middle' opacity='0.85'>
        image unavailable
      </text>
    </svg>`
  );

/**
 * ОПРЕДЕЛЕНИЕ БАЗОВОГО URL API
 * 
 * Извлекает origin из конфигурации axios-клиента с фолбэком на localhost
 * Используется для построения абсолютных путей к локальным изображениям
 */
function apiOrigin(): string {
  try {
    // Получаем baseURL из настроек axios или используем localhost по умолчанию
    const base = api.defaults.baseURL || "http://localhost:8000";
    return new URL(base).origin;
  } catch {
    // Фолбэк при ошибках парсинга URL
    return "http://localhost:8000";
  }
}

// Кэшируем origin API для многократного использования
const API_ORIGIN = apiOrigin();

/**
 * ПРОВЕРКА ЯВЛЯЕТСЯ ЛИ ИСТОЧНИК ЛОКАЛЬНЫМ
 * 
 * Определяет, нужно ли проксировать изображение или можно загружать напрямую
 * 
 * @param src - URL изображения для проверки
 * @returns boolean - true если изображение локальное
 */
function isLocalish(src: string): boolean {
  if (!src) return false;
  
  // Data URL и Blob URL считаем локальными (встроенные изображения)
  if (src.startsWith("data:") || src.startsWith("blob:")) return true;
  
  // Локальные пути к загруженным файлам
  if (src.startsWith("/uploads/") || src.startsWith("/media/")) return true;
  
  // Относительные пути
  if (src.startsWith("./") || src.startsWith("../")) return true;

  // Абсолютные URL на том же origin, что и API
  try {
    const u = new URL(src, API_ORIGIN);
    return u.origin === API_ORIGIN;
  } catch {
    // Если URL некорректен - считаем не локальным
    return false;
  }
}

/**
 * ПРОКСИРОВАНИЕ PIXIV ИЗОБРАЖЕНИЙ
 * 
 * Заменяет домен pximg.net на i.pixiv.cat для обхода географических ограничений
 * и проблем с доступностью изображений Pixiv
 * 
 * @param u - URL изображения Pixiv
 * @returns string - URL проксированного изображения
 */
function toPixivMirror(u: URL): string {
  const m = new URL(u.toString());
  m.hostname = "i.pixiv.cat";  // Заменяем на зеркальный домен
  return m.toString();
}

/**
 * ПРОКСИРОВАНИЕ ЧЕРЕЗ WORDPRESS CDN
 * 
 * Использует i0.wp.com как fallback-прокси для проблемных изображений
 * 
 * @param abs - абсолютный URL изображения
 * @returns string - URL через WordPress CDN
 */
function toWpProxy(abs: string): string {
  try {
    const u = new URL(abs);
    // Формируем URL для WordPress CDN с параметрами:
    // ?ssl=1 - принудительное использование HTTPS
    // &strip=all - удаление метаданных для уменьшения размера
    return `https://i0.wp.com/${u.host}${u.pathname}${u.search || ""}?ssl=1&strip=all`;
  } catch {
    // В случае ошибки возвращаем оригинальный URL
    return abs;
  }
}

/**
 * ОСНОВНАЯ ФУНКЦИЯ ПРОКСИРОВАНИЯ ИЗОБРАЖЕНИЙ
 * 
 * Преобразует URL изображения в безопасный для использования в <img src=...>
 * Обрабатывает различные типы источников и применяет соответствующие стратегии прокси
 * 
 * @param input - исходный URL изображения (может быть пустым или null)
 * @returns string - обработанный URL или заглушка
 */
export function proxifyImage(input?: string | null): string {
  const raw = (input || "").trim();
  if (!raw) return PLACEHOLDER;  // Пустые URL заменяем на заглушку

  // ОБРАБОТКА ЛОКАЛЬНЫХ ИЗОБРАЖЕНИЙ
  if (isLocalish(raw)) {
    try {
      // Преобразуем относительные пути в абсолютные URL относительно API
      return new URL(raw, API_ORIGIN).toString();
    } catch {
      // При ошибках парсинга возвращаем оригинальный URL
      return raw;
    }
  }

  // ОБРАБОТКА ВНЕШНИХ ИЗОБРАЖЕНИЙ
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    // Некорректные URL заменяем на заглушку
    return PLACEHOLDER;
  }

  const host = url.hostname.toLowerCase();

  // СПЕЦИАЛЬНАЯ ОБРАБОТКА PIXIV
  if (/(^|\.)pximg\.net$/.test(host)) {
    return toPixivMirror(url);
  }

  // ОСТАЛЬНЫЕ ВНЕШНИЕ ИСТОЧНИКИ - загружаем напрямую
  return url.toString();
}

/**
 * ОПРЕДЕЛЕНИЕ НЕОБХОДИМОСТИ CORS ДЛЯ ИЗОБРАЖЕНИЯ
 * 
 * Проверяет, нужно ли устанавливать атрибут crossOrigin="anonymous"
 * для корректной загрузки изображений с внешних доменов
 * 
 * @param src - URL изображения
 * @returns boolean - true если требуется crossOrigin
 */
export function needsCrossOrigin(src: string | undefined | null): boolean {
  if (!src) return false;
  
  // Data URL и Blob URL не требуют CORS
  if (src.startsWith("data:") || src.startsWith("blob:")) return false;

  try {
    const u = new URL(src, window.location.origin);

    // Изображения с того же origin не требуют CORS
    if (u.origin === window.location.origin) return false;

    // Локальные изображения от API тоже не требуют CORS
    if (u.origin === API_ORIGIN) return false;

    const h = u.hostname.toLowerCase();

    // WordPress прокси требует CORS (для возможного использования в canvas)
    if (h === "i0.wp.com") return true;

    // Консервативный подход: по умолчанию CORS не включаем
    return false;
  } catch {
    return false;
  }
}

/**
 * СИСТЕМА FALLBACK ДЛЯ ОШИБОК ЗАГРУЗКИ ИЗОБРАЖЕНИЙ
 * 
 * Многоуровневая стратегия восстановления при ошибках загрузки изображений:
 * 1. Попытка загрузки через WordPress proxy
 * 2. Замена на SVG-заглушку
 * 
 * @param e - React событие ошибки загрузки изображения
 */
export function onImgErrorFallback(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  
  // Определяем текущий шаг fallback из data-атрибута
  const step = Number(img.getAttribute("data-fallback-step") || "0");
  
  // Сохраняем оригинальный URL для возможных повторных попыток
  const original = img.getAttribute("data-original") || img.src || "";

  // Если оригинальный URL отсутствует - сразу переходим к заглушке
  if (!original) {
    img.src = PLACEHOLDER;
    img.setAttribute("data-fallback-step", "99"); // Финальный шаг
    return;
  }

  // ШАГ 0: ПЕРВАЯ ПОПЫТКА ВОССТАНОВЛЕНИЯ
  if (step === 0 && !isLocalish(original)) {
    // Для внешних изображений пробуем WordPress proxy
    img.src = toWpProxy(original);
    img.setAttribute("data-fallback-step", "1"); // Переходим к следующему шагу
    return;
  }

  // ФИНАЛЬНЫЙ ШАГ: ЗАГЛУШКА
  img.removeAttribute("crossorigin"); // Убираем CORS атрибут для заглушки
  img.src = PLACEHOLDER;
  img.setAttribute("data-fallback-step", "99"); // Отмечаем финальный шаг
}

// ===== АРХИТЕКТУРНЫЕ ОСОБЕННОСТИ СИСТЕМЫ ПРОКСИРОВАНИЯ =====

/**
 * КЛЮЧЕВЫЕ ПРИНЦИПЫ РЕАЛИЗАЦИИ:
 * 
 * 1. БЕЗОПАСНОСТЬ И НАДЕЖНОСТЬ:
 *    - Защита от некорректных URL и ошибок парсинга
 *    - Изоляция возможных XSS через изображения
 *    - Graceful degradation при ошибках
 * 
 * 2. ПРОИЗВОДИТЕЛЬНОСТЬ:
 *    - Кэширование API origin
 *    - Минимальные преобразования для локальных изображений
 *    - Быстрый переход к заглушке при ошибках
 * 
 * 3. ПОЛЬЗОВАТЕЛЬСКИЙ ОПЫТ:
 *    - Предотвращение "прыгания" layout с помощью placeholder
 *    - Многоуровневое восстановление при ошибках загрузки
 *    - Сохранение визуальной целостности интерфейса
 * 
 * 4. СОВМЕСТИМОСТЬ:
 *    - Поддержка различных типов URL (data, blob, relative, absolute)
 *    - Корректная работа с CORS политиками
 *    - Адаптация под разные источники изображений
 */

/**
 * СТРАТЕГИИ ОБРАБОТКИ РАЗЛИЧНЫХ ТИПОВ ИСТОЧНИКОВ:
 * 
 * 1. ЛОКАЛЬНЫЕ ИЗОБРАЖЕНИЯ:
 *    - /uploads/, /media/ → абсолютные URL к API
 *    - data: и blob: → используются напрямую
 *    - relative paths → преобразуются в абсолютные
 * 
 * 2. ВНЕШНИЕ ИЗОБРАЖЕНИЯ:
 *    - pximg.net → зеркало i.pixiv.cat
 *    - Остальные → напрямую
 *    - При ошибках → WordPress proxy → заглушка
 * 
 * 3. SPECIAL CASES:
 *    - Пустые URL → заглушка
 *    - Некорректные URL → заглушка
 *    - Ошибки загрузки → многоуровневый fallback
 */

/**
 * ОСОБЕННОСТИ ДЛЯ WARHAMMER 40,000 FANDOM WIKI:
 * 
 * - Тематический дизайн placeholder в стиле вселенной
 * - Поддержка разнообразных источников изображений (арты, скриншоты, фанарт)
 * - Учет возможных географических ограничений для контента
 * - Оптимизация для большого количества медиа-материалов
 */

/**
 * ВАЖНЫЕ МОМЕНТЫ ДЛЯ РАЗРАБОТЧИКОВ:
 * 
 * - Функция proxifyImage должна быть идемпотентной
 * - Система fallback использует data-атрибуты для отслеживания состояния
 * - CORS политика настраивается консервативно для безопасности
 * - Все преобразования URL должны быть безопасными и обрабатывать исключения
 * 
 * При добавлении новых источников изображений необходимо:
 * 1. Обновить функцию isLocalish при необходимости
 * 2. Добавить специальную обработку в proxifyImage
 * 3. Протестировать CORS политики для нового домена
 */

// Модуль обеспечивает надежную систему загрузки изображений
// для богатого медиа-контента Warhammer 40,000 вики



// Основные особенности комментирования:

// 1. Детальное описание стратегий проксирования

// Логика обработки разных типов URL
// Многоуровневая система fallback
// Специальная обработка для Pixiv и других сервисов


// 2. Безопасность и обработка ошибок

// Защита от некорректных URL
// Изоляция потенциальных уязвимостей
// Graceful degradation при сбоях


// 3. Архитектурные решения

// Кэширование API origin
// Использование data-атрибутов для отслеживания состояния
// Консервативная политика CORS


// 4. Контекст Warhammer 40,000

// Тематический дизайн placeholder
// Поддержка разнообразных медиа-источников
// Учет особенностей фанатского контента

// Теперь система проксирования изображений полностью документирована и понятна для разработчиков!