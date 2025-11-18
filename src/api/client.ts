import axios, { type AxiosError } from "axios";
import type { ApiUserProfile as UserProfile } from "@/models/api";

/** ================== БАЗА/КОНСТАНТЫ ================== */

/**
 * БАЗОВЫЙ URL API СЕРВЕРА
 * 
 * Определяется через переменную окружения VITE_API_URL или используется localhost по умолчанию
 * Это основной эндпоинт для всех запросов к бэкенду
 */
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * РЕЖИМ АУТЕНТИФИКАЦИИ ПРИЛОЖЕНИЯ
 * 
 * Определяет стратегию работы с пользовательскими данными:
 * - "local": локальная разработка без реального бэкенда
 * - "basic": HTTP Basic аутентификация
 * - "hybrid": комбинированный режим (basic + local)
 */
export const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE ?? "local") as
  | "local"
  | "basic"
  | "hybrid";

/**
 * УЧЕТНЫЕ ДАННЫЕ ДЛЯ BASIC АУТЕНТИФИКАЦИИ (если заданы в env)
 * 
 * Используются для автоматической аутентификации в development режиме
 */
export const BASIC_USER_ENV = import.meta.env.VITE_BASIC_USER ?? "";
export const BASIC_PASS_ENV = import.meta.env.VITE_BASIC_PASS ?? "";

/** Ключи в localStorage для хранения данных аутентификации */
const AUTH_BASIC_KEY_PRIMARY = "fw_auth";       // основной ключ (совместимость со старыми версиями)
const AUTH_BASIC_KEY_SECOND = "fw_auth_basic";  // дополнительный ключ
const AUTH_LOCAL_KEY = "fw_auth_local";         // ключ для локальной аутентификации

/** Ключ для сохранения URL возврата после авторизации */
export const RETURN_TO_KEY = "return_to";

/**
 * БАЗОВЫЙ URL ПРИЛОЖЕНИЯ
 * 
 * Используется для корректной работы в поддиректориях (деплой в subpath)
 * Удаляем завершающие слеши для единообразия
 */
const BASE_URL = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");

/**
 * УНИФИЦИРОВАННЫЙ РЕДИРЕКТ С УЧЕТОМ BASE_URL
 * 
 * Обеспечивает корректные переходы между страницами при деплое в поддиректории
 * 
 * @param to - целевой путь (абсолютный или относительный)
 */
function go(to: string) {
  const path = to.startsWith("/") ? to : `/${to}`;
  const href = `${BASE_URL}${path}`;
  // Предотвращаем лишние редиректы если мы уже на целевой странице
  if (location.pathname + location.search !== href) {
    location.href = href;
  }
}

/** ================== AXIOS КОНФИГУРАЦИЯ ================== */

/**
 * ОСНОВНОЙ ЭКЗЕМПЛЯР AXIOS ДЛЯ РАБОТЫ С API
 * 
 * Настраивает базовые параметры для всех HTTP запросов:
 * - baseURL: корневой адрес API сервера
 * - timeout: максимальное время ожидания ответа (15 секунд)
 * - headers: стандартный заголовок для JSON данных
 */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});
api.defaults.headers.common.Accept = "application/json";

// Логирование конфигурации в development режиме
if (import.meta.env.DEV) {
  console.log("[FW] API =", API_URL);
  console.log("[FW] axios base =", api.defaults.baseURL);
  console.log("[FW] AUTH_MODE =", AUTH_MODE);
}

/** ================== BASIC AUTH АУТЕНТИФИКАЦИЯ ================== */

/**
 * СТРУКТУРА ДАННЫХ BASIC АУТЕНТИФИКАЦИИ В LOCALSTORAGE
 */
type BasicStored = { username: string; password: string; exp: number };

/**
 * ЧТЕНИЕ ДАННЫХ BASIC АУТЕНТИФИКАЦИИ ИЗ LOCALSTORAGE
 * 
 * Выполняет безопасное чтение и валидацию сохраненных учетных данных:
 * - Проверяет два возможных ключа хранения (для обратной совместимости)
 * - Валидирует срок действия токена
 * - Автоматически очищает просроченные данные
 * 
 * @returns объект с логином/паролем или null если данных нет/они невалидны
 */
function readBasicAuth(): BasicStored | null {
  const tryRead = (key: string): BasicStored | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as BasicStored;
      // Проверяем наличие обязательных полей и срок действия
      if (!parsed?.username || !parsed?.password || Date.now() > Number(parsed.exp)) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed;
    } catch {
      // В случае ошибки парсинга очищаем битые данные
      localStorage.removeItem(key);
      return null;
    }
  };
  return tryRead(AUTH_BASIC_KEY_PRIMARY) || tryRead(AUTH_BASIC_KEY_SECOND);
}

/**
 * СОХРАНЕНИЕ ДАННЫХ BASIC АУТЕНТИФИКАЦИИ
 * 
 * Сохраняет логин и пароль в localStorage с установкой срока действия:
 * - Кодирует данные в Base64 для создания Basic Auth токена
 * - Немедленно устанавливает заголовок Authorization для последующих запросов
 * 
 * @param username - логин пользователя
 * @param password - пароль пользователя
 * @param days - срок хранения в днях (по умолчанию 7 дней)
 */
export function rememberBasicAuth(username: string, password: string, days = 7) {
  const exp = Date.now() + days * 24 * 3600 * 1000;
  localStorage.setItem(
    AUTH_BASIC_KEY_PRIMARY,
    JSON.stringify({ username, password, exp })
  );
  // Немедленно применяем токен для текущей сессии
  const token = btoa(`${username}:${password}`);
  api.defaults.headers.common.Authorization = `Basic ${token}`;
}

/**
 * ПРОВЕРОЧНЫЙ ЗАПРОС ПРОФИЛЯ С УКАЗАННЫМИ УЧЕТНЫМИ ДАННЫМИ
 * 
 * Выполняет тестовый запрос для проверки валидности логина/пароля
 * без изменения глобального состояния аутентификации
 * 
 * @param username - логин для проверки
 * @param password - пароль для проверки
 * @returns Promise с данными профиля пользователя
 */
export async function fetchMyProfileWithBasic(username: string, password: string) {
  const token = btoa(`${username}:${password}`);
  const { data } = await api.get<UserProfile>("/myProfile", {
    headers: { Authorization: `Basic ${token}` },
  });
  return data;
}

/** ================== LOCAL AUTH (ДЛЯ РАЗРАБОТКИ) ================== */

/**
 * СТРУКТУРА ДАННЫХ ЛОКАЛЬНОЙ АУТЕНТИФИКАЦИИ
 */
type LocalStored = { username: string; exp: number };

/**
 * ЧТЕНИЕ ДАННЫХ ЛОКАЛЬНОЙ АУТЕНТИФИКАЦИИ
 * 
 * Используется в режиме разработки для имитации входа пользователя
 * 
 * @returns объект с именем пользователя или null
 */
export function readLocalAuth(): LocalStored | null {
  try {
    const raw = localStorage.getItem(AUTH_LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalStored;
    if (!parsed?.username || Date.now() > Number(parsed.exp)) {
      localStorage.removeItem(AUTH_LOCAL_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(AUTH_LOCAL_KEY);
    return null;
  }
}

/**
 * СОХРАНЕНИЕ ДАННЫХ ЛОКАЛЬНОЙ АУТЕНТИФИКАЦИИ
 * 
 * @param username - имя пользователя
 * @param days - срок хранения в днях
 */
export function rememberLocalAuth(username: string, days = 7) {
  const exp = Date.now() + days * 24 * 3600 * 1000;
  localStorage.setItem(AUTH_LOCAL_KEY, JSON.stringify({ username, exp }));
}

/**
 * ГИБРИДНОЕ СОХРАНЕНИЕ ДАННЫХ АУТЕНТИФИКАЦИИ
 * 
 * Сохраняет учетные данные одновременно для basic и local режимов
 * 
 * @param username - логин пользователя
 * @param password - пароль пользователя
 * @param days - срок хранения
 */
export function rememberHybridAuth(username: string, password: string, days = 7) {
  rememberBasicAuth(username, password, days);
  rememberLocalAuth(username, days);
}

/** ================== ОБЩИЕ ФУНКЦИИ АУТЕНТИФИКАЦИИ ================== */

/**
 * ИНИЦИАЛИЗАЦИЯ АУТЕНТИФИКАЦИИ ИЗ LOCALSTORAGE ПРИ ЗАГРУЗКЕ ПРИЛОЖЕНИЯ
 * 
 * Восстанавливает состояние аутентификации при перезагрузке страницы:
 * - В basic/hybrid режимах: устанавливает заголовок Authorization
 * - В local режиме: очищает заголовки аутентификации
 */
export function bootstrapAuthFromStorage() {
  if (AUTH_MODE !== "local") {
    const s = readBasicAuth();
    if (!s) return;
    const token = btoa(`${s.username}:${s.password}`);
    api.defaults.headers.common.Authorization = `Basic ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

/**
 * ВЫХОД ИЗ СИСТЕМЫ (ОЧИСТКА ДАННЫХ АУТЕНТИФИКАЦИИ)
 * 
 * Удаляет все данные аутентификации из localStorage и сбрасывает заголовки axios
 */
export function dropAuth() {
  try {
    localStorage.removeItem(AUTH_LOCAL_KEY);
    localStorage.removeItem(AUTH_BASIC_KEY_PRIMARY);
    localStorage.removeItem(AUTH_BASIC_KEY_SECOND);
  } catch {}
  delete api.defaults.headers.common.Authorization;
}

/**
 * ПРЕОБРАЗОВАНИЕ ОТНОСИТЕЛЬНОГО URL В АБСОЛЮТНЫЙ
 * 
 * Используется для корректной работы с путями загруженных файлов
 * 
 * @param url - относительный URL (например /uploads/image.jpg)
 * @returns абсолютный URL включающий baseURL API
 */
function absolutify(url: string): string {
  try {
    const u = new URL(url, api.defaults.baseURL || API_URL);
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * ЗАГРУЗКА ИЗОБРАЖЕНИЯ НА СЕРВЕР
 * 
 * Выполняет multipart/form-data запрос для загрузки файла:
 * - Отправляет файл на endpoint /upload-image
 * - Возвращает абсолютный URL загруженного изображения
 * 
 * @param file - объект File для загрузки
 * @returns Promise с абсолютным URL загруженного изображения
 */
export async function uploadImageFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post<{ url: string }>("/upload-image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const url = data?.url;
  if (!url) throw new Error("Сервер не вернул url");
  return absolutify(url);
}

/**
 * СОХРАНЕНИЕ URL ДЛЯ ВОЗВРАТА ПОСЛЕ АВТОРИЗАЦИИ
 * 
 * Запоминает текущий путь для последующего перенаправления после успешного входа
 * 
 * @param path - опциональный путь для возврата (по умолчанию текущий URL)
 */
export function saveReturnTo(path?: string) {
  try {
    const p = path || location.pathname + location.search;
    sessionStorage.setItem(RETURN_TO_KEY, p);
  } catch {}
}

/**
 * ИЗВЛЕЧЕНИЕ СОХРАНЕННОГО URL ДЛЯ ВОЗВРАТА
 * 
 * Получает и удаляет сохраненный путь из sessionStorage
 * 
 * @returns сохраненный путь или null если не найден
 */
export function consumeReturnTo(): string | null {
  try {
    const v = sessionStorage.getItem(RETURN_TO_KEY);
    if (v) sessionStorage.removeItem(RETURN_TO_KEY);
    return v;
  } catch {
    return null;
  }
}

/** ================== INTERCEPTORS (ПЕРЕХВАТЧИКИ AXIOS) ================== */

/**
 * БЕЗОПАСНОЕ ЧТЕНИЕ ЗНАЧЕНИЯ ЗАГОЛОВКА ИЗ КОНФИГА AXIOS
 * 
 * Обрабатывает различные форматы заголовков в разных версиях axios:
 * - AxiosHeaders (современные версии) с методом .get()
 * - Plain objects (старые версии)
 * 
 * @param headers - объект заголовков из конфига axios
 * @param nameLower - имя заголовка в нижнем регистре
 * @returns значение заголовка или undefined
 */
function getHeaderValue(
  headers: any,
  nameLower: string
): string | undefined {
  if (!headers) return undefined;

  // Современные версии axios (AxiosHeaders)
  if (typeof headers.get === "function") {
    const val = headers.get(nameLower);
    if (val != null) return String(val);
  }

  // Старые версии или нормализованные объекты
  const bag =
    typeof headers.toJSON === "function" ? headers.toJSON() : headers;

  // Поиск по нормализованным ключам (case-insensitive)
  for (const k of Object.keys(bag)) {
    if (k.toLowerCase() === nameLower) return String((bag as any)[k]);
  }
  return undefined;
}

/**
 * INTERCEPTOR ДЛЯ ИСХОДЯЩИХ ЗАПРОСОВ
 * 
 * Автоматически добавляет заголовок Authorization для basic/hybrid режимов:
 * - Читает сохраненные учетные данные из localStorage
 * - Формирует Basic Auth токен и добавляет в заголовок
 */
api.interceptors.request.use((config) => {
  if (AUTH_MODE !== "local") {
    const s = readBasicAuth();
    if (s) {
      const token = btoa(`${s.username}:${s.password}`);
      // Поддержка разных форматов заголовков в axios
      if (config.headers && typeof (config.headers as any).set === "function") {
        (config.headers as any).set("Authorization", `Basic ${token}`);
      } else {
        (config.headers ??= {} as any);
        (config.headers as any).Authorization = `Basic ${token}`;
      }
    }
  }
  return config;
});

/**
 * INTERCEPTOR ДЛЯ ВХОДЯЩИХ ОТВЕТОВ И ОШИБОК
 * 
 * Централизованная обработка ошибок API:
 * - Сетевые ошибки → редирект на /network
 * - Ошибки 401/403 → выход из системы и редирект на страницу входа
 * - Другие HTTP ошибки → редирект на соответствующие страницы ошибок
 */
api.interceptors.response.use(
  (r) => r, // Успешные ответы пропускаем без изменений
  (err: AxiosError & { code?: string }) => {
    // Обработка сетевых ошибок
    if (err.code === "ERR_NETWORK" || !err.response) {
      if (!location.pathname.startsWith(`${BASE_URL}/network`)) go("/network");
      return Promise.reject(err);
    }

    const status = err.response.status;
    const path = location.pathname;
    const search = location.search;

    // В local-режиме игнорируем ошибки аутентификации
    if ((status === 401 || status === 403) && AUTH_MODE === "local") {
      return Promise.reject(err);
    }

    // Проверяем специальный заголовок для отключения редиректов
    const headerVal = getHeaderValue(err.config?.headers, "x-skip-auth-redirect");
    const skipAuthRedirect = headerVal === "1";

    // Белый список страниц где редиректы не нужны
    const isWhitelisted = /^\/(error(\/|$)|network(\/|$)|profile(\/|$)|register(\/|$))/.test(
      path.replace(BASE_URL, "")
    );

    // Обработка ошибок аутентификации/авторизации
    if ((status === 401 || status === 403) && !skipAuthRedirect) {
      dropAuth();
      if (!isWhitelisted && path !== `${BASE_URL}/profile`) {
        saveReturnTo(path + search);
        go("/profile?expired=1");
      }
      return Promise.reject(err);
    }

    // Обработка других HTTP ошибок
    const handled = [404, 409, 418, 429, 500, 502, 503, 504];
    if (handled.includes(status)) {
      if (!path.startsWith(`${BASE_URL}/error/`)) go(`/error/${status}`);
    }
    return Promise.reject(err);
  }
);

/**
 * УНИВЕРСАЛЬНАЯ ФУНКЦИЯ СОХРАНЕНИЯ АУТЕНТИФИКАЦИИ
 * 
 * Выбирает соответствующую стратегию сохранения в зависимости от AUTH_MODE
 * 
 * @param username - логин пользователя
 * @param password - пароль пользователя
 * @param days - срок хранения в днях
 */
export function rememberAuth(username: string, password: string, days = 7) {
  if (AUTH_MODE === "local") return rememberLocalAuth(username, days);
  if (AUTH_MODE === "hybrid") return rememberHybridAuth(username, password, days);
  return rememberBasicAuth(username, password, days);
}



// ОСНОВНЫЕ КОМПОНЕНТЫ СИСТЕМЫ:

// 1. Конфигурация API

// Базовые настройки axios для взаимодействия с бэкендом
// Переменные окружения для разных режимов развертывания

// 2. Многорежимная аутентификация

// Local: для разработки без реального бэкенда
// Basic: HTTP Basic аутентификация для production
// Hybrid: комбинированный режим для гибкости

// 3. Управление состоянием аутентификации

// Безопасное хранение в localStorage с проверкой срока действия
// Автоматическое восстановление сессии при загрузке приложения
// Централизованный выход из системы

// 4. Интерцепторы для обработки ошибок

// Единая точка обработки сетевых и HTTP ошибок
// Интеллектуальные редиректы в зависимости от типа ошибки
// Поддержка специальных заголовков для управления поведением

// 5. Вспомогательные сервисы

// Загрузка файлов с преобразованием URL
// Управление возвратом после авторизации
// Кросс-браузерная работа с хранилищем

// Этот файл является центральным узлом для всех HTTP-взаимодействий 
// в приложении Warhammer 40,000 Fandom Wiki, обеспечивая надежную работу 
// в различных режимах и сценариях использования.




