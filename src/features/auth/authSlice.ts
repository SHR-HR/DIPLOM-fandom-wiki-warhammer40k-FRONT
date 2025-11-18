import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AUTH_MODE,
  api,
  rememberBasicAuth,
  fetchMyProfileWithBasic,
  rememberLocalAuth,
  readLocalAuth,
  dropAuth,
  rememberHybridAuth,
} from "@/api/client";
import type { ApiUserProfile as UserProfile } from "@/models/api";

/**
 * ТИПЫ ДЛЯ СИСТЕМЫ АУТЕНТИФИКАЦИИ
 * 
 * Status: статус выполнения асинхронных операций
 * AuthState: полное состояние системы аутентификации
 */
type Status = "idle" | "loading" | "succeeded" | "failed";

type AuthState = {
  me: UserProfile | null;          // Данные текущего пользователя
  isAuthed: boolean;               // Флаг авторизации
  mode: "local" | "basic" | "hybrid"; // Режим работы аутентификации
  status: Status;                  // Статус текущей операции
  error?: string;                  // Сообщение об ошибке
};

/**
 * НАЧАЛЬНОЕ СОСТОЯНИЕ СИСТЕМЫ АУТЕНТИФИКАЦИИ
 * 
 * Инициализируется с пустыми данными пользователя и режимом из конфигурации
 */
const initialState: AuthState = {
  me: null,
  isAuthed: false,
  mode: AUTH_MODE,
  status: "idle",
};

/**
 * НОРМАЛИЗАЦИЯ ДАННЫХ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
 * 
 * Приводит данные профиля к единому формату, обрабатывая различные варианты полей ID
 * от API (id, user_id) для обеспечения обратной совместимости
 */
const normalizeUser = (p: any): UserProfile => {
  const id = p?.id ?? p?.user_id ?? 0;
  return { ...p, id };
};

/** ---------------- ЛОКАЛЬНЫЙ ВХОД (РЕЖИМ РАЗРАБОТКИ) ---------------- */

/**
 * ASYNC THUNK ДЛЯ ЛОКАЛЬНОЙ АУТЕНТИФИКАЦИИ
 * 
 * Режим для разработки без реального бэкенда:
 * - Требует только логин (минимум 3 символа)
 * - Создает заглушку профиля пользователя
 * - Сохраняет данные в localStorage при remember = true
 */
export const loginLocal = createAsyncThunk<
  UserProfile,
  { username: string; password: string; remember?: boolean },
  { rejectValue: string }
>("auth/loginLocal", async ({ username, remember = true }, { rejectWithValue }) => {
  if (username.trim().length < 3) return rejectWithValue("Логин слишком короткий");
  if (remember) rememberLocalAuth(username, 7);
  const localMe: UserProfile = { id: 0, name: username, ava: "" } as UserProfile;
  return localMe;
});

/** ---------------- BASIC ВХОД (СТАНДАРТНАЯ АУТЕНТИФИКАЦИЯ) ---------------- */

/**
 * ASYNC THUNK ДЛЯ BASIC АУТЕНТИФИКАЦИИ
 * 
 * Режим для продакшн с реальной проверкой учетных данных:
 * - Проверяет логин/пароль через API
 * - Сохраняет credentials в sessionStorage
 * - Возвращает реальные данные профиля с сервера
 */
export const loginBasic = createAsyncThunk<
  UserProfile,
  { username: string; password: string },
  { rejectValue: string }
>("auth/loginBasic", async ({ username, password }, { rejectWithValue }) => {
  try {
    const raw: any = await fetchMyProfileWithBasic(username, password);
    const me = normalizeUser(raw);
    rememberBasicAuth(username, password);
    return me;
  } catch {
    return rejectWithValue("Неверный логин или пароль");
  }
});

/** ---------------- HYBRID ВХОД (КОМБИНИРОВАННЫЙ РЕЖИМ) ---------------- */

/**
 * ASYNC THUNK ДЛЯ ГИБРИДНОЙ АУТЕНТИФИКАЦИИ
 * 
 * Умный режим, сочетающий преимущества local и basic:
 * - Пытается выполнить реальную аутентификацию через API
 * - При неудаче откатывается на локальную аутентификацию
 * - Сохраняет соответствующие данные в зависимости от результата
 */
export const loginHybrid = createAsyncThunk<
  UserProfile,
  { username: string; password: string; remember?: boolean },
  { rejectValue: string }
>("auth/loginHybrid", async ({ username, password, remember = true }, { rejectWithValue }) => {
  try {
    // Попытка реальной аутентификации через API
    const raw: any = await fetchMyProfileWithBasic(username, password);
    const me = normalizeUser(raw);
    rememberHybridAuth(username, password, remember ? 7 : 1);
    return me;
  } catch {
    // Откат на локальную аутентификацию при ошибке API
    if (username.trim().length >= 3) {
      rememberLocalAuth(username, 7);
      return { id: 0, name: username, ava: "" } as UserProfile;
    }
    return rejectWithValue("Неверный логин или пароль");
  }
});

/** ---------------- УНИВЕРСАЛЬНЫЙ LOGIN (ФАСАД ДЛЯ ВСЕХ РЕЖИМОВ) ---------------- */

/**
 * ASYNC THUNK ДЛЯ УНИВЕРСАЛЬНОГО ВХОДА
 * 
 * Единая точка входа, которая автоматически выбирает правильный метод
 * аутентификации в зависимости от настроенного режима (AUTH_MODE)
 */
export const login = createAsyncThunk<
  UserProfile,
  { username: string; password: string; remember?: boolean },
  { rejectValue: string }
>("auth/login", async (p, { dispatch, rejectWithValue }) => {
  try {
    if (AUTH_MODE === "local")   return await dispatch(loginLocal(p)).unwrap();
    if (AUTH_MODE === "hybrid")  return await dispatch(loginHybrid(p)).unwrap();
    return await dispatch(loginBasic(p)).unwrap();
  } catch (e: any) {
    return rejectWithValue(e?.message || "Ошибка входа");
  }
});

/** ---------------- ИНИЦИАЛИЗАЦИЯ АУТЕНТИФИКАЦИИ ПРИ ЗАГРУЗКЕ ПРИЛОЖЕНИЯ ---------------- */

/**
 * ASYNC THUNK ДЛЯ ИНИЦИАЛИЗАЦИИ АУТЕНТИФИКАЦИИ
 * 
 * Выполняется при запуске приложения для восстановления сессии:
 * - В local режиме: восстанавливает из localStorage
 * - В hybrid режиме: пытается API, при неудаче - localStorage  
 * - В basic режиме: только через API
 */
export const initAuth = createAsyncThunk<UserProfile, void, { rejectValue: string }>(
  "auth/init",
  async (_, { rejectWithValue }) => {
    if (AUTH_MODE === "local") {
      const s = readLocalAuth();
      if (!s) return rejectWithValue("not authed");
      return { id: 0, name: s.username, ava: "" } as UserProfile;
    }

    if (AUTH_MODE === "hybrid") {
      try {
        // Попытка получить профиль через API (без редиректа при 401)
        const { data } = await api.get<any>("/myProfile", { headers: { "X-Skip-Auth-Redirect": "1" } });
        return normalizeUser(data);
      } catch {
        // Откат на локальную аутентификацию при ошибке API
        const s = readLocalAuth();
        if (s) return { id: 0, name: s.username, ava: "" } as UserProfile;
        return rejectWithValue("not authed");
      }
    }

    // BASIC режим - только API аутентификация
    try {
      const { data } = await api.get<any>("/myProfile", { headers: { "X-Skip-Auth-Redirect": "1" } });
      return normalizeUser(data);
    } catch {
      return rejectWithValue("not authed");
    }
  }
);

/** ---------------- ВЫХОД ИЗ СИСТЕМЫ ---------------- */

/**
 * ASYNC THUNK ДЛЯ ВЫХОДА ИЗ СИСТЕМЫ
 * 
 * Очищает все данные аутентификации:
 * - Удаляет credentials из storage
 * - Сбрасывает состояние в Redux
 */
export const logout = createAsyncThunk("auth/logout", async () => {
  dropAuth();
});

/**
 * SLICE ДЛЯ УПРАВЛЕНИЯ СОСТОЯНИЕМ АУТЕНТИФИКАЦИИ
 * 
 * Обрабатывает все действия, связанные с аутентификацией пользователя:
 * - Инициализацию при запуске приложения
 * - Процессы входа и выхода
 * - Управление данными текущего пользователя
 */
const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * СИНХРОННОЕ ДЕЙСТВИЕ ДЛЯ УСТАНОВКИ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
     * 
     * Используется для прямого обновления профиля без API запросов
     */
    setMe(state, action: PayloadAction<UserProfile | null>) {
      state.me = action.payload;
      state.isAuthed = !!action.payload;
    },
  },
  extraReducers: (b) => {
    // ОБРАБОТЧИКИ ДЛЯ ИНИЦИАЛИЗАЦИИ АУТЕНТИФИКАЦИИ
    b.addCase(initAuth.pending,   (s) => { s.status = "loading"; s.error = undefined; });
    b.addCase(initAuth.fulfilled, (s, a) => { s.status = "succeeded"; s.me = a.payload; s.isAuthed = true; });
    b.addCase(initAuth.rejected,  (s) => { s.status = "idle"; s.me = null; s.isAuthed = false; });

    // ОБРАБОТЧИКИ ДЛЯ ПРОЦЕССА ВХОДА
    b.addCase(login.pending,      (s) => { s.status = "loading"; s.error = undefined; });
    b.addCase(login.fulfilled,    (s, a) => { s.status = "succeeded"; s.me = a.payload; s.isAuthed = true; });
    b.addCase(login.rejected,     (s, a) => { s.status = "failed"; s.error = (a.payload as string) || "Ошибка входа"; s.me = null; s.isAuthed = false; });

    // ОБРАБОТЧИК ДЛЯ ВЫХОДА
    b.addCase(logout.fulfilled,   (s) => { s.me = null; s.isAuthed = false; s.status = "idle"; });
  },
});

export const { setMe } = slice.actions;
export default slice.reducer;




// Комментарии объясняют:

// 1. Многорежимную архитектуру аутентификации

// Local режим - для разработки без бэкенда
// Basic режим - стандартная HTTP аутентификация
// Hybrid режим - умное сочетание с откатом при ошибках

// 2. Систему async thunk операций

// Специализированные thunk для каждого режима работы
// Универсальный login thunk как фасад для всех режимов
// Инициализацию при запуске для восстановления сессии

// 3. Бизнес-логику управления сессиями

// Сохранение credentials в соответствующих storage
// Нормализацию данных от API для единообразия
// Обработку ошибок с грациозной деградацией

// 4. Управление состоянием аутентификации

// Отслеживание статусов операций (idle, loading, succeeded, failed)
// Синхронизацию флага isAuthed с данными пользователя
// Очистку состояния при выходе из системы

// 5. Особенности реализации

// Заголовок X-Skip-Auth-Redirect для предотвращения циклов редиректов
// Раздельную логику для разных режимов в initAuth
// Единую точку входа через универсальный login

// Этот слайс обеспечивает гибкую и надежную систему аутентификации 
// для Warhammer 40,000 Fandom Wiki, поддерживающую различные сценарии 
// использования от разработки до продакшн с сохранением пользовательского опыта.




