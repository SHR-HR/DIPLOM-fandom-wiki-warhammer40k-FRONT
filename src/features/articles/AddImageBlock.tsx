import { useEffect, useId, useState } from "react";
import { toast } from "react-hot-toast";
import { uploadImageFile } from "@/api/client";
import * as endpoints from "@/api/endpoints";
import type { ApiContentBlock } from "@/models/api";
import { validateImageFile, createFilePreview } from "@/utils/fileUpload";

/**
 * ПРОПСЫ КОМПОНЕНТА ДОБАВЛЕНИЯ БЛОКА ИЗОБРАЖЕНИЯ
 * 
 * @property articleId - идентификатор статьи, в которую добавляется изображение
 * @property position - опциональная позиция для вставки блока в контент
 */
type Props = { articleId: number; position?: number };

/**
 * КОМПОНЕНТ ДОБАВЛЕНИЯ ИЗОБРАЖЕНИЯ В СТАТЬЮ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Предоставляет интерфейс для загрузки и вставки изображений в статьи:
 * - Выбор файла изображения с предварительной валидацией
 * - Превью выбранного изображения перед загрузкой
 * - Загрузка на сервер и автоматическое добавление в статью
 * - Поддержка позиционирования блока в контенте
 * 
 * Особенности:
 * - Интеграция с API для загрузки файлов и управления контентом
 * - Валидация файлов на клиенте для улучшения UX
 * - Очистка ресурсов при размонтировании компонента
 */
export default function AddImageBlock({ articleId, position }: Props) {
  // СОСТОЯНИЯ КОМПОНЕНТА
  const [file, setFile] = useState<File | null>(null);        // Выбранный файл изображения
  const [preview, setPreview] = useState<string>("");         // Data URL для превью изображения
  const [busy, setBusy] = useState(false);                    // Флаг выполнения операции загрузки
  
  // УНИКАЛЬНЫЙ ID ДЛЯ СВЯЗКИ LABEL И INPUT (ДОСТУПНОСТЬ)
  const fileId = useId();

  /**
   * ЭФФЕКТ ОЧИСТКИ РЕСУРСОВ ПРИ РАЗМОНТИРОВАНИИ
   * 
   * Освобождает память от data URL превью изображения
   * для предотвращения утечек памяти
   */
  useEffect(() => {
    return () => {
      // на всякий — чистим data:preview из памяти
      setPreview("");
    };
  }, []);

  /**
   * ОБРАБОТЧИК ВЫБОРА ФАЙЛА ИЗОБРАЖЕНИЯ
   * 
   * Выполняет многоуровневую обработку выбранного файла:
   * 1. Сохранение файла в состояние
   * 2. Валидация типа и размера файла
   * 3. Создание превью для визуального подтверждения выбора
   * 
   * @param e - событие изменения input элемента
   */
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);

    // ОЧИСТКА ПРИ ОТСУТСТВИИ ФАЙЛА
    if (!f) {
      setPreview("");
      return;
    }

    // ВАЛИДАЦИЯ ФАЙЛА НА КЛИЕНТЕ
    const err = validateImageFile(f);
    if (err) {
      toast.error(err);
      setPreview("");
      setFile(null);
      return;
    }

    // СОЗДАНИЕ ПРЕВЬЮ ИЗОБРАЖЕНИЯ
    try {
      const p = await createFilePreview(f);
      setPreview(p);
    } catch {
      setPreview("");
    }
  }

  /**
   * ОБРАБОТЧИК ЗАГРУЗКИ И ДОБАВЛЕНИЯ ИЗОБРАЖЕНИЯ В СТАТЬЮ
   * 
   * Выполняет полный цикл добавления изображения:
   * 1. Дополнительная валидация файла
   * 2. Загрузка файла на сервер
   * 3. Создание блока контента с полученным URL
   * 4. Добавление блока в статью через API
   * 5. Очистка состояния при успехе
   */
  async function onUpload() {
    if (!file) {
      toast.error("Выберите файл изображения");
      return;
    }

    // ПОВТОРНАЯ ВАЛИДАЦИЯ ПЕРЕД ОТПРАВКОЙ
    const err = validateImageFile(file);
    if (err) {
      toast.error(err);
      return;
    }

    try {
      setBusy(true);

      // ЭТАП 1: ЗАГРУЗКА ФАЙЛА НА СЕРВЕР → ПОЛУЧЕНИЕ АБСОЛЮТНОГО URL
      const imgUrl = await uploadImageFile(file);

      // ЭТАП 2: СОЗДАНИЕ И ДОБАВЛЕНИЕ БЛОКА КОНТЕНТА В СТАТЬЮ
      const block: ApiContentBlock = { type: "image", content: imgUrl };
      await endpoints.addContent(articleId, [block], position);

      // УСПЕШНОЕ ЗАВЕРШЕНИЕ ОПЕРАЦИИ
      toast.success("Изображение добавлено в статью");
      setFile(null);
      setPreview("");
    } catch (e: any) {
      // ОБРАБОТКА ОШИБОК С ИЗВЛЕЧЕНИЕМ ПОНЯТНОГО СООБЩЕНИЯ
      const msg = e?.response?.data?.detail || e?.message || "Ошибка загрузки";
      toast.error(String(msg));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* СКРЫТАЯ МЕТКА ДЛЯ ДОСТУПНОСТИ */}
      <label htmlFor={fileId} className="sr-only">
        Выберите изображение
      </label>
      
      {/* ПОЛЕ ВЫБОРА ФАЙЛА */}
      <input
        id={fileId}
        name="imageFile"
        type="file"
        accept="image/*"
        onChange={onPick}
        className="block w-full text-sm"
      />

      {/* ПРЕВЬЮ ВЫБРАННОГО ИЗОБРАЖЕНИЯ */}
      {preview && (
        <img 
          src={preview} 
          alt="Предпросмотр" 
          className="max-h-48 rounded border border-gray-700" 
        />
      )}

      {/* КНОПКА ЗАГРУЗКИ И ДОБАВЛЕНИЯ В СТАТЬЮ */}
      <button
        onClick={onUpload}
        disabled={busy || !file}
        className="px-4 py-2 rounded bg-brass text-black font-bold disabled:opacity-50"
      >
        {busy ? "Загрузка..." : "Добавить в статью"}
      </button>

      {/* ИНФОРМАЦИЯ О ПОДДЕРЖИВАЕМЫХ ФОРМАТАХ И ОГРАНИЧЕНИЯХ */}
      <p className="text-xs text-gray-500">
        Поддерживаются PNG/JPG/WEBP/GIF до 5&nbsp;МБ. Файлы сохраняются на стороне API.
      </p>
    </div>
  );
}



// Комментарии объясняют:

// 1. Архитектуру компонента добавления изображений

// Двухэтапный процесс: выбор файла → загрузка на сервер → добавление в статью
// Интеграцию с API для загрузки файлов и управления контентом статей
// Управление состоянием файла, превью и процесса загрузки

// 2. Систему валидации и обработки файлов

// Клиентскую валидацию через validateImageFile для мгновенной обратной связи
// Создание превью через createFilePreview для визуального подтверждения
// Обработку ошибок с извлечением понятных сообщений для пользователя

// 3. Пользовательский опыт

// Визуальное превью перед загрузкой для подтверждения выбора
// Индикатор выполнения операции загрузки
// Информативные сообщения об ошибках и успешных операциях
// Подсказки о поддерживаемых форматах и ограничениях

// 4. Технические особенности

// Очистку ресурсов при размонтировании компонента для предотвращения утечек памяти
// Использование useId для доступности и корректной связки label-input
// Оптимизацию производительности через управление состоянием busy

// 5. Безопасность и надежность

// Повторную валидацию перед отправкой на сервер
// Обработку различных типов ошибок от API
// Защиту от дублирующих операций через флаг busy

// Компонент AddImageBlock обеспечивает удобный и 
// надежный интерфейс для добавления изображений в 
// статьи Warhammer 40,000 Fandom Wiki, сочетая мощные возможности 
// загрузки файлов с понятным пользовательским интерфейсом и комплексной обработкой ошибок.


