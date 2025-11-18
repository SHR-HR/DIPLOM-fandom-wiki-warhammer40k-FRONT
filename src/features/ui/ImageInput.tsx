import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { createFilePreview, validateImageFile } from "@/utils/fileUpload";
import { toast } from "react-hot-toast";
import EditorImagePreview from "@/components/forms/EditorImagePreview";
import { uploadImageFile } from "@/api/client";

/**
 * ПРОПСЫ КОМПОНЕНТА ВВОДА ИЗОБРАЖЕНИЙ
 * 
 * @property value - Текущее значение (URL изображения или data URL)
 * @property onChange - Функция обратного вызова при изменении значения
 * @property label - Опциональная метка для поля ввода
 * @property placeholder - Опциональный placeholder для текстового поля
 */
interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

/**
 * ОБЩИЙ КЛАСС ДЛЯ ПОЛЕЙ ВВОДА С ПОДДЕРЖКОЙ ТЕМ
 * 
 * Универсальные стили для полей ввода, работающие в светлой и темной темах:
 * - Базовые стили размера, отступов и скруглений
 * - Цветовые схемы для светлой и темной тем
 * - Фокус-стили в цветовой палитре Warhammer 40,000 (brass)
 */
const field =
  "w-full px-4 py-2 rounded-lg transition outline-none " +
  "bg-white border border-gray-300 text-gray-900 placeholder-gray-400 " +
  "focus:ring-2 focus:ring-brass focus:border-brass " +
  "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400";

/**
 * КОМПОНЕНТ ВВОДА ИЗОБРАЖЕНИЙ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Универсальный компонент для загрузки и управления изображениями:
 * - Поддерживает два режима: URL ввод и загрузка файлов
 * - Интегрируется с API для загрузки файлов на сервер
 * - Предоставляет превью изображений с индикацией режима
 * - Обеспечивает отказоустойчивость при недоступности бэкенда
 */
export default function ImageInput({ value, onChange, label, placeholder }: Props) {
  /**
   * СОСТОЯНИЯ КОМПОНЕНТА
   * 
   * - preview: локальный data URL для превью (при загрузке файлов)
   * - isFileMode: флаг режима работы (true = файл, false = URL)
   */
  const [preview, setPreview] = useState<string>("");
  const [isFileMode, setIsFileMode] = useState(false);
  
  /**
   * REF ДЛЯ СКРЫТОГО INPUT ФАЙЛА
   * 
   * Позволяет программно вызывать диалог выбора файла
   */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ОБРАБОТЧИК ИЗМЕНЕНИЯ ВЫБРАННОГО ФАЙЛА
   * 
   * Выполняет многоуровневую обработку загрузки файла:
   * 1. Валидация файла на клиенте
   * 2. Попытка загрузки на сервер
   * 3. Откат на локальное превью при ошибке сервера
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ВАЛИДАЦИЯ ФАЙЛА НА КЛИЕНТЕ
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      // ПОПЫТКА ЗАГРУЗКИ НА СЕРВЕР
      const uploadedUrl = await uploadImageFile(file);
      
      // УСПЕШНАЯ ЗАГРУЗКА НА СЕРВЕР
      setIsFileMode(false);     // Переключаем в режим URL (серверный)
      setPreview("");           // Очищаем локальное превью
      onChange(uploadedUrl);    // Передаем серверный URL в форму
      toast.success("Изображение загружено на сервер");
    } catch (err: any) {
      // ОШИБКА СЕРВЕРА - ОТКАТ НА ЛОКАЛЬНОЕ ПРЕВЬЮ
      try {
        const previewUrl = await createFilePreview(file);
        setPreview(previewUrl);
        setIsFileMode(true);
        onChange(previewUrl);
        toast.error("Бэкенд недоступен — показан локальный превью (не публикуется)");
      } catch (e2: any) {
        // КРИТИЧЕСКАЯ ОШИБКА - НЕ УДАЛОСЬ СОЗДАТЬ ПРЕВЬЮ
        toast.error(err?.message || "Ошибка загрузки файла");
      }
    }
  };

  /**
   * ОБРАБОТЧИК ИЗМЕНЕНИЯ URL ВРУЧНУЮ
   * 
   * Переключает компонент в режим URL и обновляет значение
   */
  const handleUrlChange = (url: string) => {
    setIsFileMode(false);
    setPreview("");
    onChange(url);
  };

  /**
   * ОЧИСТКА ТЕКУЩЕГО ИЗОБРАЖЕНИЯ
   * 
   * Сбрасывает все состояния и очищает поле ввода
   */
  const clearPreview = () => {
    setPreview("");
    setIsFileMode(false);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * ОПРЕДЕЛЕНИЕ ИЗОБРАЖЕНИЯ ДЛЯ ОТОБРАЖЕНИЯ
   * 
   * В режиме файла используем локальное превью (data URL)
   * В режиме URL используем переданное значение (URL)
   * Важно: передаем исходник без обработки - EditorImagePreview/SmartImg сами разберутся
   */
  const displayImage = isFileMode ? preview : value;

  return (
    <div className="space-y-2">
      {/* ОПЦИОНАЛЬНАЯ МЕТКА ПОЛЯ */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* ГРУППА ЭЛЕМЕНТОВ УПРАВЛЕНИЯ */}
      <div className="flex gap-2">
        {/* ПОЛЕ ВВОДА URL */}
        <input
          type="text"
          className={field}
          placeholder={placeholder || "https://example.com/image.webp"}
          value={isFileMode ? "" : value}
          onChange={(e) => handleUrlChange(e.target.value)}
          disabled={isFileMode}
        />
        
        {/* КНОПКА ЗАГРУЗКИ ФАЙЛА */}
        <button
          type="button"
          className="px-4 py-2 rounded-lg transition flex items-center gap-2
            bg-gray-100 text-gray-800 hover:bg-brass hover:text-black border border-brass
            dark:bg-gray-800 dark:text-gray-100"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-5 h-5" />
          <span className="hidden sm:inline">Файл</span>
        </button>
        
        {/* КНОПКА ОЧИСТКИ (ПОКАЗЫВАЕТСЯ ТОЛЬКО ЕСЛИ ЕСТЬ ИЗОБРАЖЕНИЕ) */}
        {(isFileMode || value) && (
          <button
            type="button"
            className="px-3 py-2 bg-mech hover:bg-red-700 text-white rounded-lg transition"
            onClick={clearPreview}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* СКРЫТЫЙ INPUT ДЛЯ ВЫБОРА ФАЙЛА */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ПРЕВЬЮ ИЗОБРАЖЕНИЯ С ИНДИКАТОРОМ РЕЖИМА */}
      {displayImage && (
        <div className="relative">
          {/* КОМПОНЕНТ ПРЕВЬЮ С АВТОМАТИЧЕСКОЙ ОБРАБОТКОЙ URL */}
          <EditorImagePreview
            url={displayImage}
            maxHeight={256}
            className="rounded-lg"
          />
          
          {/* ИНДИКАТОР ЛОКАЛЬНОГО РЕЖИМА */}
          {isFileMode && (
            <div className="absolute top-2 right-2 bg-brass text-black px-2 py-1 rounded text-xs font-bold">
              ЛОКАЛЬНО
            </div>
          )}
        </div>
      )}

      {/* ПРЕДУПРЕЖДЕНИЕ О ЛОКАЛЬНОМ РЕЖИМЕ */}
      {isFileMode && (
        <p className="text-xs text-yellow-600 dark:text-yellow-500">
          ⚠️ Сервер не принял файл — сейчас используется локальное превью (в публикацию не попадёт).
        </p>
      )}
    </div>
  );
}



// Комментарии объясняют:

// 1. Архитектуру компонента

// Двойной режим работы: URL ввод и загрузка файлов
// Интеграцию с API для загрузки на сервер
// Отказоустойчивость при недоступности бэкенда

// 2. Пользовательский опыт

// Интуитивный интерфейс с понятными кнопками действий
// Визуальную обратную связь через toast уведомления
// Превью изображений для подтверждения выбора
// Ясные индикаторы режима работы (локальный/серверный)

// 3. Бизнес-логику обработки файлов

// Многоуровневую валидацию на клиенте и сервере
// Гибкую стратегию загрузки с откатом на локальное решение
// Поддержку различных форматов через accept="image/*"

// 4. Технические особенности

// Управление состоянием через useState и useRef
// Интеграцию с системой уведомлений через react-hot-toast
// Поддержку темизации через условные CSS классы

// 5. Обработку ошибок и edge cases

// Защиту от некорректных файлов на этапе валидации
// Грациозную деградацию при проблемах с сервером
// Четкие сообщения об ошибках для пользователя

// Компонент ImageInput обеспечивает надежный и удобный 
// интерфейс для работы с изображениями в Warhammer 40,000 Fandom Wiki, 
// сочетая мощные возможности загрузки файлов с отказоустойчивостью и 
// понятным пользовательским интерфейсом.



