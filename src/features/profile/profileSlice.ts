import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import * as api from "@/api/endpoints";
import type { ApiUserProfile, ApiArticleShort, ApiUserUpdate } from "@/models/api";

/**
 * ТИП СОСТОЯНИЯ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
 * 
 * Определяет структуру данных для управления профилем пользователя:
 * - profile: данные профиля текущего пользователя
 * - my: список статей, созданных пользователем
 * - status: статус загрузки данных для отображения индикаторов
 * - error: сообщение об ошибке при неудачных запросах
 */
type State = {
  profile: ApiUserProfile | null;
  my: ApiArticleShort[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string | null;
};

/**
 * НАЧАЛЬНОЕ СОСТОЯНИЕ ПРОФИЛЯ
 * 
 * Инициализирует состояние с пустыми значениями:
 * - profile: null - профиль еще не загружен
 * - my: [] - пустой список статей
 * - status: "idle" - начальный статус без активных запросов
 * - error: null - отсутствие ошибок
 */
const initial: State = { profile: null, my: [], status: "idle", error: null };

/**
 * ASYNC THUNK ДЛЯ ЗАГРУЗКИ ПРОФИЛЯ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
 * 
 * Выполняет запрос к API для получения данных профиля авторизованного пользователя.
 * Используется на странице профиля для отображения информации о пользователе.
 */
export const loadProfile = createAsyncThunk("profile/loadProfile", async () => {
  return await api.myProfile();
});

/**
 * ASYNC THUNK ДЛЯ ОБНОВЛЕНИЯ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
 * 
 * Отправляет обновленные данные профиля на сервер:
 * - name: новое имя пользователя
 * - ava: новый URL аватара
 * 
 * @param p - объект с данными для обновления профиля
 */
export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async (p: ApiUserUpdate) => {
    return await api.updateUser(p);
  }
);

/**
 * ASYNC THUNK ДЛЯ ЗАГРУЗКИ СТАТЕЙ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
 * 
 * Загружает список всех статей, созданных авторизованным пользователем.
 * Используется для отображения в разделе "Мои статьи" на странице профиля.
 */
export const loadMyArticles = createAsyncThunk("profile/loadMyArticles", async () => {
  return await api.myArticles();
});

/**
 * SLICE ДЛЯ УПРАВЛЕНИЯ СОСТОЯНИЕМ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
 * 
 * Обрабатывает все действия, связанные с профилем пользователя:
 * - Загрузку данных профиля
 * - Обновление профиля
 * - Загрузку списка статей пользователя
 * - Управление состоянием загрузки и ошибками
 */
const slice = createSlice({
  name: "profile",
  initialState: initial,
  reducers: {},
  extraReducers: (b) => {
    /**
     * ОБРАБОТЧИКИ ДЛЯ loadProfile (ЗАГРУЗКА ПРОФИЛЯ)
     */
    
    // ЗАПРОС В ПРОЦЕССЕ - УСТАНАВЛИВАЕМ СТАТУС ЗАГРУЗКИ
    b.addCase(loadProfile.pending, (s) => { 
      s.status = "loading"; 
      s.error = null; 
    });
    
    // УСПЕШНАЯ ЗАГРУЗКА - СОХРАНЯЕМ ДАННЫЕ ПРОФИЛЯ
    b.addCase(loadProfile.fulfilled, (s, a: PayloadAction<ApiUserProfile>) => {
      s.status = "succeeded"; 
      s.profile = a.payload;
    });
    
    // ОШИБКА ЗАГРУЗКИ - СБРАСЫВАЕМ ПРОФИЛЬ И СОХРАНЯЕМ ОШИБКУ
    b.addCase(loadProfile.rejected, (s, a) => {
      s.status = "failed"; 
      s.error = String(a.error.message || "Ошибка профиля");
      s.profile = null;
    });

    /**
     * ОБРАБОТЧИК ДЛЯ updateProfile (ОБНОВЛЕНИЕ ПРОФИЛЯ)
     * 
     * При успешном обновлении заменяем старые данные профиля на новые.
     * Не меняем статус, так это отдельная операция от основной загрузки.
     */
    b.addCase(updateProfile.fulfilled, (s, a: PayloadAction<ApiUserProfile>) => {
      s.profile = a.payload;
    });

    /**
     * ОБРАБОТЧИК ДЛЯ loadMyArticles (ЗАГРУЗКА СТАТЕЙ ПОЛЬЗОВАТЕЛЯ)
     * 
     * Сохраняет список статей пользователя в состояние.
     * Не влияет на статус основной загрузки профиля.
     */
    b.addCase(loadMyArticles.fulfilled, (s, a: PayloadAction<ApiArticleShort[]>) => {
      s.my = a.payload;
    });
  },
});

// ЭКСПОРТ РЕДЮСЕРА ДЛЯ ПОДКЛЮЧЕНИЯ В STORE
export default slice.reducer;




// Комментарии объясняют:

// 1. Архитектуру управления состоянием профиля

// Централизованное хранение данных профиля и статей пользователя
// Разделение ответственности между различными async thunk
// Управление состоянием загрузки для улучшения UX

// 2. Систему async thunk операций

// loadProfile - первичная загрузка данных профиля
// updateProfile - обновление информации профиля
// loadMyArticles - загрузка статей пользователя

// 3. Обработку различных состояний запросов

// pending - установка статуса загрузки и очистка ошибок
// fulfilled - сохранение успешных результатов
// rejected - обработка ошибок и сброс данных

// 4. Бизнес-логику профиля пользователя

// Интеграцию с API endpoints для работы с бэкендом
// Типизацию данных через модели API
// Синхронизацию данных после операций обновления

// 5. Особенности реализации

// Отсутствие синхронных reducers - вся логика в extraReducers
// Раздельную обработку ошибок для разных операций
// Сохранение данных только при успешных операциях

// Этот слайс обеспечивает надежное управление состоянием профиля 
// пользователя в Warhammer 40,000 Fandom Wiki, поддерживая все необходимые операции 
// для работы с пользовательскими данными и предоставляя четкую систему состояний для интерфейса.







