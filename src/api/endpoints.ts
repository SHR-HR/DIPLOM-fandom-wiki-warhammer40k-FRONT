import { api, rememberAuth, AUTH_MODE } from "./client";
import type {
  ApiArticle,
  ApiArticleCreate,
  ApiArticleShort,
  ApiMainInfo,
  ApiContentBlock,
  ApiUserProfile,
  ApiUserUpdate,
} from "@/models/api";

/**
 * ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ СТРАНИЦЫ СТАТЕЙ
 * 
 * Выполняет запрос к API для получения пагинированного списка статей
 * с поддержкой поиска и сортировки на серверной стороне
 * 
 * @param start - смещение для пагинации (сколько элементов пропустить)
 * @param limit - количество элементов на странице
 * @param q - поисковый запрос (опционально)
 * @param sort - поле для сортировки (id, title, author)
 * @param dir - направление сортировки (asc, desc)
 * @returns объект с общим количеством статей и массивом элементов текущей страницы
 */
async function getArticlesPage(
  start = 0,
  limit = 20,
  q?: string,
  sort?: "id" | "title" | "author",
  dir?: "asc" | "desc"
) {
  const { data } = await api.get<{ total: number; items: ApiArticleShort[] }>("/articles", {
    params: {
      start,
      limit,
      q: q || undefined,
      sort: sort || undefined,
      dir: dir || undefined,
    },
  });
  return data;
}

// ===== ARTICLES =================================================

/**
 * ПОЛУЧЕНИЕ СПИСКА СТАТЕЙ С ПАГИНАЦИЕЙ И ФИЛЬТРАЦИЕЙ
 * 
 * Основная функция для загрузки статей на главной странице и в списках:
 * - Поддерживает пагинацию через параметры start и limit
 * - Обеспечивает поиск по заголовку через параметр q
 * - Предоставляет сортировку по различным полям и направлениям
 * 
 * @returns Promise с объектом содержащим массив статей и общее количество
 */
export async function getArticles(
  start = 0,
  limit = 20,
  q?: string,
  sort?: "id" | "title" | "author",
  dir?: "asc" | "desc"
): Promise<{ items: ApiArticleShort[]; total: number }> {
  const { total, items } = await getArticlesPage(start, limit, q, sort, dir);
  return { items, total };
}

/**
 * ПОЛУЧЕНИЕ КОНКРЕТНОЙ СТАТЬИ ПО ID
 * 
 * Загружает полные данные статьи для страницы просмотра
 * 
 * @param id - уникальный идентификатор статьи
 * @returns Promise с полным объектом статьи
 */
export const getArticle = (id: number) =>
  api.get<ApiArticle>(`/articles/${id}`).then((r) => r.data);

/**
 * СОЗДАНИЕ НОВОЙ СТАТЬИ
 * 
 * Отправляет данные новой статьи на сервер для создания
 * 
 * @param payload - данные для создания статьи (заголовок, превью, основная информация)
 * @returns Promise с результатом создания и ID новой статьи
 */
export const createArticle = (payload: ApiArticleCreate) =>
  api.post<{ ok: true; id: number }>("/articles", payload).then((r) => r.data);

/**
 * ДОБАВЛЕНИЕ БЛОКОВ КОНТЕНТА В СТАТЬЮ С УКАЗАНИЕМ ПОЗИЦИИ
 * 
 * Выполняет безопасное добавление блоков контента в существующую статью:
 * 1. Загружает текущий контент статьи
 * 2. Вставляет новые блоки в указанную позицию
 * 3. Сохраняет обновленный контент на сервере
 * 
 * @param id - идентификатор статьи
 * @param blocks - массив добавляемых блоков контента
 * @param position - позиция для вставки (если не указано - в конец)
 * @returns Promise с обновленной статьей
 */
export async function addContent(id: number, blocks: ApiContentBlock[], position?: number) {
  const current = await getArticle(id);
  const exist = (current.mainContent ?? []) as ApiContentBlock[];
  const pos =
    Number.isFinite(Number(position)) && position !== undefined
      ? Math.max(0, Number(position))
      : exist.length;
  const head = exist.slice(0, pos);
  const tail = exist.slice(pos);
  const next = [...head, ...blocks, ...tail];
  await api.patch(`/articles/${id}`, { mainContent: next });
  return getArticle(id);
}

/**
 * ПОЛНАЯ ЗАМЕНА КОНТЕНТА СТАТЬИ
 * 
 * Заменяет весь контент статьи на новый массив блоков
 * 
 * @param id - идентификатор статьи
 * @param blocks - новый массив блоков контента
 * @returns Promise с обновленной статьей
 */
export async function redoContent(id: number, blocks: ApiContentBlock[]) {
  await api.patch(`/articles/${id}`, { mainContent: blocks });
  return getArticle(id);
}

/**
 * ЧАСТИЧНОЕ ОБНОВЛЕНИЕ ОСНОВНОЙ ИНФОРМАЦИИ СТАТЬИ
 * 
 * Обновляет только указанные поля основной информации о персонаже
 * 
 * @param id - идентификатор статьи
 * @param info - объект с обновляемыми полями основной информации
 * @returns Promise с обновленной статьей
 */
export async function changeInfo(id: number, info: Partial<ApiMainInfo>) {
  await api.patch(`/articles/${id}`, { mainInfo: info });
  return getArticle(id);
}

/**
 * УДАЛЕНИЕ СТАТЬИ
 * 
 * Удаляет статью по идентификатору
 * 
 * @param id - идентификатор статьи для удаления
 * @returns Promise с результатом удаления
 */
export const deleteArticle = (id: number) =>
  api.delete<{ ok: true; removed: number }>(`/articles/${id}`).then((r) => r.data);

// ===== PROFILE ==================================================

/**
 * ТИХАЯ ЗАГРУЗКА ПРОФИЛЯ БЕЗ РЕДИРЕКТОВ ПРИ ОШИБКАХ
 * 
 * Используется для инициализации аутентификации и проверки сессии:
 * - Не вызывает редиректы при 401/403 ошибках
 * - Возвращает данные профиля или ошибку для обработки
 * 
 * @returns Promise с данными профиля пользователя
 */
export const myProfileSilent = () =>
  api
    .get<ApiUserProfile>("/myProfile", { headers: { "X-Skip-Auth-Redirect": "1" } })
    .then((r) => r.data);

/**
 * ОБЫЧНАЯ ЗАГРУЗКА ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
 * 
 * Стандартный запрос профиля с обработкой редиректов при ошибках аутентификации
 * 
 * @returns Promise с данными профиля пользователя
 */
export const myProfile = () => api.get<ApiUserProfile>("/myProfile").then((r) => r.data);

/**
 * ОБНОВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
 * 
 * Отправляет обновленные данные профиля на сервер:
 * - В случае ошибки 404/405 (метод не поддерживается) выполняется fallback на клиенте
 * - Для других ошибок исключение пробрасывается дальше
 * 
 * @param p - объект с обновляемыми данными профиля
 * @returns Promise с обновленными данными профиля
 */
export async function updateUser(p: ApiUserUpdate) {
  try {
    const { data } = await api.put<ApiUserProfile>("/updateUser", p);
    return data;
  } catch (err: any) {
    const code = err?.response?.status;
    if (code && code !== 404 && code !== 405) throw err;
    const base = await myProfileSilent();
    return { ...base, ...p };
  }
}

/**
 * ПОЛУЧЕНИЕ СТАТЕЙ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
 * 
 * Загружает список статей, созданных авторизованным пользователем
 * 
 * @returns Promise с массивом статей пользователя
 */
export const myArticles = () =>
  api.get<{ total: number; items: ApiArticleShort[] }>("/myArticles").then((r) => r.data.items);

// ===== AUTH (register/login) ====================================

/**
 * РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ
 * 
 * Выполняет регистрацию пользователя в системе:
 * - Отправляет данные регистрации на сервер
 * - В не-local режимах сохраняет учетные данные
 * - В local режиме создает заглушку профиля
 * 
 * @param p - данные для регистрации (имя, логин, пароль, email, аватар)
 * @returns Promise с данными профиля пользователя
 */
export async function registerUserApi(p: {
  name: string;
  login: string;
  password: string;
  email?: string;
  ava?: string;
}) {
  await api.post<{ ok: boolean; created_id: number }>("/register", p);

  if (AUTH_MODE !== "local") {
    rememberAuth(p.login, p.password);
    return myProfile();
  }

  // Локальная имитация профиля — без сетевых вызовов
  const localProfile: ApiUserProfile = {
    id: 0,
    name: p.name,
    authored: 0,
    totalArticles: 0 as any, // при желании можно считать по списку статей
    ava: p.ava || "",
    user_id: 0,
  };
  return localProfile;
}

/**
 * АУТЕНТИФИКАЦИЯ ПОЛЬЗОВАТЕЛЯ
 * 
 * Выполняет вход пользователя в систему:
 * - Сохраняет учетные данные для будущих запросов
 * - В local режиме возвращает заглушку профиля
 * - В других режимах загружает реальный профиль с сервера
 * 
 * @param login - логин пользователя
 * @param password - пароль пользователя
 * @returns Promise с данными профиля пользователя
 */
export async function loginUserApi(login: string, password: string) {
  rememberAuth(login, password);

  if (AUTH_MODE === "local") {
    // Возвращаем минимально достаточный профиль, не ходя на сервер
    const localProfile: ApiUserProfile = {
      id: 0,
      name: login,
      authored: 0,
      totalArticles: 0 as any,
      ava: "",
      user_id: 0,
    };
    return localProfile;
  }

  return myProfile();
}

/* ----------- АЛИАСЫ ДЛЯ СОВМЕСТИМОСТИ С REDUX SLICES ----------- */

/**
 * Алиас для createArticle - используется в editorSlice
 */
export const postNew = createArticle;

/**
 * Алиас для changeInfo - используется в editorSlice
 */
export const putChangeInfo = changeInfo;

/**
 * Алиас для addContent - используется в editorSlice
 */
export const putAddBlocks = addContent;

/**
 * Алиас для redoContent - используется в editorSlice
 */
export const putRedoBlocks = redoContent;





// Комментарии объясняют:

// 1. Архитектуру API слоя приложения

// Разделение на логические группы: статьи, профиль, аутентификация
// Единообразную обработку ошибок и различных режимов работы
// Интеграцию с Redux slices через алиасы для обратной совместимости

// 2. Систему работы со статьями

// CRUD операции для управления статьями (создание, чтение, обновление, удаление)
// Пагинацию и фильтрацию для эффективной работы с большими списками
// Безопасное редактирование контента с контролем позиционирования

// 3. Управление пользовательскими данными

// Профиль пользователя с различными стратегиями загрузки (тихая/обычная)
// Гибкое обновление данных с fallback на клиенте при ошибках сервера
// Разделение статей пользователя от общего списка

// 4. Систему аутентификации и регистрации

// Поддержку различных режимов (local, basic, hybrid) через AUTH_MODE
// Автоматическое сохранение учетных данных для последующих запросов
// Заглушки для локальной разработки без необходимости реального бэкенда

// 5. Технические особенности реализации

// Типизацию всех методов в соответствии с моделями данных
// Обработку edge cases (отсутствие методов API, ошибки сети)
// Оптимизацию запросов через переиспользование вспомогательных функций

// Этот файл endpoints.ts является центральным узлом 
// взаимодействия с бэкенд API для Warhammer 40,000 Fandom Wiki, 
// обеспечивая надежную и типобезопасную работу со всеми данными приложения в 
// различных режимах работы и сценариях использования.

