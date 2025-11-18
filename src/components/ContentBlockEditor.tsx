import { useState } from "react";
import { Trash2, Info } from "lucide-react";
import ImageInput from "@/features/ui/ImageInput";
import type { ApiContentBlock } from "@/models/api";

/**
 * ИНТЕРФЕЙС ПРОПСОВ КОМПОНЕНТА РЕДАКТОРА КОНТЕНТНОГО БЛОКА
 * 
 * Определяет структуру данных для взаимодействия с родительским компонентом:
 * - block: данные редактируемого блока контента
 * - index: позиция блока в массиве для идентификации при операциях
 * - onUpdate: callback функция для обновления содержимого блока
 * - onRemove: callback функция для удаления блока из массива
 */
interface Props {
  block: ApiContentBlock;
  index: number;
  onUpdate: (index: number, content: any) => void;
  onRemove: (index: number) => void;
}

/**
 * УНИВЕРСАЛЬНЫЙ CSS КЛАСС ДЛЯ ПОЛЕЙ ВВОДА
 * 
 * Определяет стили для полей ввода, поддерживающие светлую и темную темы:
 * - Базовые стили: отступы, скругления, переходы
 * - Цветовые схемы для светлой и темной тем
 * - Стили фокуса в цветовой палитре Warhammer 40,000 (brass)
 */
const field =
  "w-full px-4 py-2 rounded-lg transition outline-none " +
  "bg-white border border-gray-300 text-gray-900 placeholder-gray-400 " +
  "focus:ring-2 focus:ring-brass focus:border-brass " +
  "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400";

/**
 * КОМПОНЕНТ РЕДАКТОРА КОНТЕНТНОГО БЛОКА WARHAMMER 40,000 FANDOM WIKI
 * 
 * Предоставляет интерфейс для редактирования отдельных блоков контента статьи:
 * - Заголовки различных уровней (h1, h2)
 * - Текстовые параграфы (p) 
 * - Изображения с загрузкой файлов (image)
 * - Маркированные списки (ul)
 * 
 * Ключевые особенности:
 * - Интеллектуальные подсказки для каждого типа блока
 * - Валидация содержимого с визуальной обратной связью
 * - Универсальная обработка различных форматов данных
 * - Интеграция с системой загрузки изображений
 */
export default function ContentBlockEditor({ block, index, onUpdate, onRemove }: Props) {
  /**
   * СОСТОЯНИЕ ОТОБРАЖЕНИЯ ВСПЛЫВАЮЩЕЙ ПОДСКАЗКИ
   * 
   * Управляет видимостью tooltip с описанием назначения типа блока
   * Активируется при наведении на иконку информации
   */
  const [showTooltip, setShowTooltip] = useState(false);

  /**
   * ФУНКЦИЯ ПОЛУЧЕНИЯ ТЕКСТА ПОДСКАЗКИ ДЛЯ ТИПА БЛОКА
   * 
   * Возвращает контекстно-зависимое описание, объясняющее назначение
   * и правильное использование конкретного типа контентного блока
   * 
   * @returns {string} Текст подсказки для текущего типа блока
   */
  const getTooltip = () => {
    switch (block.type) {
      case "h1": return "Основной заголовок раздела";
      case "h2": return "Подзаголовок для структурирования контента";
      case "p": return "Основной текстовый блок";
      case "image": return "Добавить изображение (URL или файл с устройства)";
      case "ul": return "Список элементов (каждая строка = элемент)";
      default: return "";
    }
  };

  /**
   * ФУНКЦИЯ ПОЛУЧЕНИЯ PLACEHOLDER ТЕКСТА ДЛЯ ПОЛЯ ВВОДА
   * 
   * Возвращает контекстно-зависимый placeholder текст
   * с примерами заполнения для каждого типа блока
   * 
   * @returns {string} Placeholder текст для поля ввода
   */
  const getPlaceholder = () => {
    switch (block.type) {
      case "h1": return "Введите основной заголовок...";
      case "h2": return "Введите подзаголовок...";
      case "p": return "Введите текст параграфа...";
      case "ul": return "Элемент списка 1\nЭлемент списка 2\nЭлемент списка 3";
      default: return "Введите текст...";
    }
  };

  /**
   * ФУНКЦИЯ ВАЛИДАЦИИ СОДЕРЖИМОГО БЛОКА
   * 
   * Проверяет, содержит ли блок валидные данные для сохранения:
   * - Для списков (ul): массив должен содержать хотя бы один элемент
   * - Для других типов: строка должна быть непустой после trim()
   * 
   * @returns {boolean} Результат валидации содержимого блока
   */
  const isValid = () => {
    if (block.type === "ul") {
      return Array.isArray(block.content) && block.content.length > 0;
    }
    return block.content && String(block.content).trim().length > 0;
  };

  // --- УНИВЕРСАЛЬНАЯ ПОДДЕРЖКА РАБОТЫ СО СПИСКАМИ (UL) ---

  /**
   * ПРЕОБРАЗОВАНИЕ ДАННЫХ СПИСКА В ТЕКСТ ДЛЯ РЕДАКТИРОВАНИЯ
   * 
   * Конвертирует массив элементов списка в строку с разделителем "\n"
   * для отображения в текстовом поле. Поддерживает различные форматы:
   * - Массив строк: ["элемент1", "элемент2"]
   * - Массив объектов: [{content: "элемент1"}, {content: "элемент2"}]
   * 
   * @returns {string} Текст списка для отображения в textarea
   */
  const getUlTextareaValue = () => {
    if (!Array.isArray(block.content)) return "";
    return block.content
      .map((li: any) => (typeof li === "string" ? li : li?.content ?? ""))
      .join("\n");
  };

  /**
   * ПРЕОБРАЗОВАНИЕ ТЕКСТА ИЗ РЕДАКТОРА В СТРУКТУРУ ДАННЫХ СПИСКА
   * 
   * Разбивает текст на строки, обрабатывает и преобразует в массив объектов
   * с полем content для совместимости с API форматом
   * 
   * @param {string} text - Текст из текстового поля редактора
   */
  const setUlFromTextarea = (text: string) => {
    const next = text
      .split("\n")                    // Разделение на строки
      .map((s) => s.trim())          // Удаление пробелов по краям
      .filter(Boolean)               // Удаление пустых строк
      .map((line) => ({ content: line })); // Преобразование в объекты
    onUpdate(index, next);
  };
  // ---------------------------------------------------------

  return (
    /**
     * КОНТЕЙНЕР РЕДАКТОРА БЛОКА С УСЛОВНЫМ СТИЛЕМ ВАЛИДАЦИИ
     * 
     * Визуально выделяет блоки с невалидным содержимым цветом ошибки (mech)
     * для информирования пользователя о необходимости заполнения поля
     */
    <div
      className={`p-4 rounded-lg border-2 transition-all
        bg-white text-gray-900 border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,.04)]
        dark:bg-gray-900 dark:text-gray-100 ${isValid() ? "dark:border-gray-700" : "dark:border-mech/50 border-mech/40"}`}
    >

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* ИНДИКАТОР ТИПА БЛОКА С СТИЛИЗОВАННЫМ БЕЙДЖЕМ */}
          <span
            className="text-sm font-semibold px-2 py-1 rounded
              bg-gray-100 text-gray-800
              dark:bg-gray-800 dark:text-gray-200"
          >
            {block.type.toUpperCase()}
          </span>
          
          {/* КНОПКА ПОДСКАЗКИ С ВСПЛЫВАЮЩИМ ОКНОМ */}
          <div className="relative">
            <button
              type="button"
              className="text-gray-500 hover:text-brass transition dark:text-gray-400"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              aria-label="Подсказка по типу блока"
            >
              <Info className="w-4 h-4" />
            </button>
            {/* ВСПЛЫВАЮЩАЯ ПОДСКАЗКА ПРИ НАВЕДЕНИИ */}
            {showTooltip && (
              <div className="tooltip -top-10 left-0 whitespace-nowrap">
                {getTooltip()}
              </div>
            )}
          </div>
          
          {/* ИНДИКАТОР НЕВАЛИДНОГО СОДЕРЖИМОГО */}
          {!isValid() && (
            <span className="text-xs text-mech">Заполните поле</span>
          )}
        </div>
        
        {/* КНОПКА УДАЛЕНИЯ БЛОКА С ПОДТВЕРЖДЕНИЕМ ДЕЙСТВИЯ */}
        <button
          type="button"
          className="text-mech hover:text-red-400 transition p-2 hover:bg-mech/10 rounded"
          onClick={() => onRemove(index)}
          aria-label="Удалить блок"
          title="Удалить блок"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>


      

      {block.type === "image" ? (
        <ImageInput
          value={typeof block.content === "string" ? block.content : ""}
          onChange={(val) => onUpdate(index, val)}
          placeholder="URL изображения или загрузите с устройства"
        />
      ) : 
      

      block.type === "ul" ? (
        <textarea
          className={field}
          placeholder={getPlaceholder()}
          rows={4}
          value={getUlTextareaValue()}
          onChange={(e) => setUlFromTextarea(e.target.value)}
        />
      ) : 
      

      (
        <textarea
          className={field}
          placeholder={getPlaceholder()}
          // Динамическое количество строк: 4 для параграфов, 2 для заголовков
          rows={block.type === "p" ? 4 : 2}
          value={typeof block.content === "string" ? block.content : ""}
          onChange={(e) => onUpdate(index, e.target.value)}
        />
      )}
    </div>
  );
}






// Комментарии объясняют:

// 1. Архитектуру редактора контентных блоков

// Универсальный интерфейс для редактирования всех типов блоков контента
// Специализированные редакторы для каждого типа блока (текст, изображения, списки)
// Интеграцию с родительскими компонентами через callback функции

// 2. Систему управления состоянием и валидации

// Локальное состояние для управления UI элементами (tooltip)
// Валидацию содержимого с визуальной обратной связью
// Условное оформление для валидных и невалидных блоков

// 3. Пользовательский опыт

// Контекстные подсказки для каждого типа блока
// Интуитивные placeholder с примерами заполнения
// Визуальные индикаторы необходимости заполнения полей
// Удобное управление списками через текстовые области

// 4. Обработку различных форматов данных

// Универсальную поддержку списков с преобразованием между текстом и структурой данных
// Совместимость с API через правильное форматирование данных
// Гибкую работу с изображениями через специализированный компонент ImageInput

// 5. Технические особенности

// Переиспользуемые стили через константу field
// Доступность через aria-атрибуты и семантическую разметку
// Поддержку тем через условные CSS классы

// Компонент ContentBlockEditor обеспечивает мощный 
// и удобный интерфейс для редактирования контентных блоков 
// в Warhammer 40,000 Fandom Wiki, сочетая гибкость работы с 
// различными типами контента с интуитивно понятным пользовательским 
// интерфейсом и комплексной валидацией данных.




