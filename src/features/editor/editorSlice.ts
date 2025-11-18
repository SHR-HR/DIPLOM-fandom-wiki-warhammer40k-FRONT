import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { ApiArticleCreate, ApiContentBlock, ApiMainInfo } from "@/models/api";
import * as endpoints from "@/api/endpoints";

/**
 * ASYNC THUNK ДЛЯ СОЗДАНИЯ НОВОЙ СТАТЬИ
 * 
 * Отправляет данные новой статьи на сервер и возвращает идентификатор созданной статьи.
 * Используется при создании новой статьи через редактор.
 * 
 * @param payload - данные статьи для создания (заголовок, превью, основная информация, контент)
 * @returns { id: number } - идентификатор созданной статьи
 */
export const createNew = createAsyncThunk<
  { id: number },
  (ApiArticleCreate & { mainContent?: ApiContentBlock[] })
>("editor/createNew", async (payload) => {
  const res = await endpoints.postNew(payload); // { ok: true; id: number }
  return { id: res.id };
});

/**
 * ASYNC THUNK ДЛЯ ОБНОВЛЕНИЯ ОСНОВНОЙ ИНФОРМАЦИИ СТАТЬИ
 * 
 * Обновляет основную информацию о персонаже (имя, возраст, внешность и т.д.)
 * в существующей статье.
 * 
 * @param id - идентификатор статьи для обновления
 * @param info - объект с обновляемыми полями основной информации
 */
export const putChangeInfo = createAsyncThunk<
  unknown,
  { id: number; info: Partial<ApiMainInfo> }
>("editor/putChangeInfo", async ({ id, info }) => {
  return await endpoints.putChangeInfo(id, info);
});

/**
 * ASYNC THUNK ДЛЯ ДОБАВЛЕНИЯ БЛОКОВ КОНТЕНТА
 * 
 * Добавляет новые блоки контента (заголовки, параграфы, изображения, списки)
 * в существующую статью с возможностью указания позиции вставки.
 * 
 * @param id - идентификатор статьи для обновления
 * @param blocks - массив добавляемых блоков контента
 * @param position - опциональная позиция для вставки (если не указано - в конец)
 */
export const putAddContent = createAsyncThunk<
  unknown,
  { id: number; blocks: ApiContentBlock[]; position?: number }
>("editor/putAddContent", async ({ id, blocks, position }) => {
  return await endpoints.putAddBlocks(id, blocks, position);
});

/**
 * ASYNC THUNK ДЛЯ ПОЛНОЙ ЗАМЕНЫ КОНТЕНТА СТАТЬИ
 * 
 * Полностью заменяет все блоки контента в статье на новые.
 * Используется при массовом редактировании или импорте контента.
 * 
 * @param id - идентификатор статьи для обновления
 * @param blocks - новый массив блоков контента
 */
export const putRedoContent = createAsyncThunk<
  unknown,
  { id: number; blocks: ApiContentBlock[] }
>("editor/putRedoContent", async ({ id, blocks }) => {
  return await endpoints.putRedoBlocks(id, blocks);
});

/**
 * ТИП СОСТОЯНИЯ РЕДАКТОРА СТАТЕЙ
 * 
 * Управляет состоянием операций редактирования статей:
 * - lastSavedId: ID последней успешно созданной/сохраненной статьи
 * - status: текущий статус операции редактирования
 * - error: сообщение об ошибке при неудачных операциях
 */
type EditorState = {
  lastSavedId?: number | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string | null;
};

/**
 * НАЧАЛЬНОЕ СОСТОЯНИЕ РЕДАКТОРА
 * 
 * Инициализирует состояние редактора с пустыми значениями:
 * - lastSavedId: null - еще не создано ни одной статьи
 * - status: "idle" - отсутствие активных операций
 * - error: null - отсутствие ошибок
 */
const initialState: EditorState = {
  lastSavedId: null,
  status: "idle",
  error: null,
};

/**
 * SLICE ДЛЯ УПРАВЛЕНИЯ СОСТОЯНИЕМ РЕДАКТОРА СТАТЕЙ
 * 
 * Обрабатывает все операции редактирования статей в Warhammer 40,000 Fandom Wiki:
 * - Создание новых статей
 * - Обновление основной информации о персонажах
 * - Добавление и изменение блоков контента
 * - Управление состоянием загрузки и ошибками операций
 */
const slice = createSlice({
  name: "editor",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    /**
     * ОБРАБОТЧИКИ ДЛЯ createNew (СОЗДАНИЕ НОВОЙ СТАТЬИ)
     */
    
    // ЗАПРОС В ПРОЦЕССЕ - УСТАНАВЛИВАЕМ СТАТУС ЗАГРУЗКИ
    b.addCase(createNew.pending, (s) => {
      s.status = "loading";
      s.error = null;
    });
    
    // УСПЕШНОЕ СОЗДАНИЕ - СОХРАНЯЕМ ID СТАТЬИ
    b.addCase(createNew.fulfilled, (s, a) => {
      s.status = "succeeded";
      s.lastSavedId = a.payload.id;
    });
    
    // ОШИБКА СОЗДАНИЯ - СОХРАНЯЕМ СООБЩЕНИЕ ОБ ОШИБКЕ
    b.addCase(createNew.rejected, (s, a) => {
      s.status = "failed";
      s.error = String(a.error.message || "Failed to create");
    });

    /**
     * ОБРАБОТЧИКИ ДЛЯ ОСТАЛЬНЫХ ОПЕРАЦИЙ РЕДАКТИРОВАНИЯ
     * 
     * Объединяем обработку для putChangeInfo, putAddContent, putRedoContent
     * так как они имеют одинаковую логику изменения состояния:
     * - pending: установка статуса загрузки
     * - fulfilled: установка статуса успеха
     * - rejected: установка статуса ошибки
     */
    [putChangeInfo, putAddContent, putRedoContent].forEach((th) => {
      // ЗАПРОС В ПРОЦЕССЕ
      b.addCase(th.pending, (s) => {
        s.status = "loading";
        s.error = null;
      });
      
      // УСПЕШНОЕ ВЫПОЛНЕНИЕ
      b.addCase(th.fulfilled, (s) => {
        s.status = "succeeded";
      });
      
      // ОШИБКА ВЫПОЛНЕНИЯ
      b.addCase(th.rejected, (s, a) => {
        s.status = "failed";
        s.error = String(a.error.message || "Request failed");
      });
    });
  },
});

// ЭКСПОРТ РЕДЮСЕРА ДЛЯ ПОДКЛЮЧЕНИЯ В STORE
export default slice.reducer;



// Комментарии объясняют:

// 1. Архитектуру управления состоянием редактора

// Централизованное управление операциями редактирования статей
// Разделение операций на создание и различные типы обновлений
// Унифицированную обработку состояния для группы операций

// 2. Систему async thunk операций редактирования

// createNew - создание совершенно новой статьи
// putChangeInfo - обновление основной информации о персонаже
// putAddContent - добавление блоков контента с контролем позиции
// putRedoContent - полная замена всего контента статьи

// 3. Логику управления состоянием операций

// Отслеживание последней созданной статьи через lastSavedId
// Универсальную систему статусов для всех операций
// Централизованную обработку ошибок с понятными сообщениями

// 4. Особенности реализации редактора

// Интеграцию с API endpoints для всех операций редактирования
// Оптимизированную обработку группы операций через цикл forEach
// Сохранение идентификатора только для операции создания

// 5. Бизнес-логику работы с контентом

// Поддержку различных типов блоков контента (заголовки, текст, изображения, списки)
// Гибкое управление структурой статьи через позиционирование блоков
// Раздельное управление основной информацией и контентом

// Этот слайс обеспечивает надежное управление состоянием редактора
// статей в Warhammer 40,000 Fandom Wiki, поддерживая все необходимые операции 
// для создания и редактирования контента с четкой системой состояний 
// для пользовательского интерфейса.



