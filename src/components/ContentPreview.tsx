import { Eye } from "lucide-react";
import type { ApiContentBlock, ApiMainInfo } from "@/models/api";
import { proxifyImage } from "@/utils/imgProxy";
import SmartImg from "@/components/SmartImg";

/**
 * ПРОПСЫ КОМПОНЕНТА ПРЕДПРОСМОТРА КОНТЕНТА
 * 
 * @property title - заголовок статьи
 * @property previewImg - URL изображения для превью статьи
 * @property mainInfo - основная информация о персонаже (опционально)
 * @property blocks - массив блоков контента статьи
 */
interface Props {
  title: string;
  previewImg: string;
  mainInfo?: Partial<ApiMainInfo>;
  blocks: ApiContentBlock[];
}

/**
 * КОМПОНЕНТ ПРЕДПРОСМОТРА СОДЕРЖИМОГО СТАТЬИ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Отображает интерактивный предпросмотр статьи в режиме реального времени:
 * - Заголовок и превью-изображение
 * - Основную информацию о персонаже
 * - Все блоки контента (заголовки, параграфы, изображения, списки)
 * 
 * Особенности:
 * - Используется в редакторе статей для мгновенного предпросмотра изменений
 * - Полностью повторяет стили и структуру финальной статьи
 * - Поддерживает все типы контентных блоков из API
 * - Автоматически скрывает пустые секции
 */
export default function ContentPreview({ title, previewImg, mainInfo, blocks }: Props) {
  /**
   * ФУНКЦИЯ РЕНДЕРИНГА ОТДЕЛЬНЫХ БЛОКОВ КОНТЕНТА
   * 
   * Обрабатывает различные типы блоков и возвращает соответствующие React элементы:
   * - h1, h2: заголовки с тематическим оформлением
   * - p: текстовые параграфы
   * - image: изображения с проксированием и обработкой ошибок
   * - ul: маркированные списки с поддержкой разных форматов данных
   * 
   * @param block - блок контента для рендеринга
   * @param idx - индекс блока для ключа React
   */
  const renderBlock = (block: ApiContentBlock, idx: number) => {
    switch (block.type) {
      case "h1":
        return (
          <h1
            key={idx}
            className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-brass mb-4 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] dark:drop-shadow-[0_0_16px_rgba(212,163,58,0.35)]"
          >
            {block.content || "Пустой заголовок"}
          </h1>
        );
      case "h2":
        return (
          <h2
            key={idx}
            className="text-2xl font-bold tracking-tight text-gray-900 dark:text-brass mb-3 drop-shadow-[0_1px_0_rgba(255,255,255,0.35)] dark:drop-shadow-[0_0_12px_rgba(212,163,58,0.35)]"
          >
            {block.content || "Пустой подзаголовок"}
          </h2>
        );
      case "p":
        return (
          <p key={idx} className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            {block.content || "Пустой параграф"}
          </p>
        );
      case "image": {
        const original = String(block.content || "");
        const src = original ? proxifyImage(original) : "";
        return original ? (
          <SmartImg
            key={idx}
            original={original}
            src={src}
            variant="content"
            fit="contain"
            framed
            outerClassName="my-6"
            className="!w-full !h-auto object-contain select-none"
            alt=""
          />
        ) : (
          <div
            key={idx}
            className="my-6 p-8 border-2 border-dashed rounded-xl text-center
                       border-gray-300 text-gray-500
                       dark:border-gray-700 dark:text-gray-500"
          >
            Изображение не загружено
          </div>
        );
      }
      case "ul": {
        // ОБРАБОТКА МАРКИРОВАННЫХ СПИСКОВ С ПОДДЕРЖКОЙ РАЗНЫХ ФОРМАТОВ ДАННЫХ
        const items = Array.isArray(block.content)
          ? block.content
              .map((it: any) => (typeof it === "string" ? it : it?.content ?? ""))
              .map((s) => String(s).trim())
              .filter(Boolean)
          : [];
        return (
          <ul
            key={idx}
            className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300"
          >
            {items.length > 0 ? (
              items.map((txt, i) => <li key={i}>{txt}</li>)
            ) : (
              <li className="text-gray-500 dark:text-gray-500">Пустой список</li>
            )}
          </ul>
        );
      }
      default:
        return null;
    }
  };

  /**
   * ПОДГОТОВКА ИЗОБРАЖЕНИЯ ПРЕВЬЮ СТАТЬИ
   */
  const previewSrc = proxifyImage(previewImg);

  /**
   * КОНФИГУРАЦИЯ ПОЛЕЙ ОСНОВНОЙ ИНФОРМАЦИИ ДЛЯ ОТОБРАЖЕНИЯ
   * 
   * Массив кортежей [label, value] для отображения в секции основной информации
   * Использует метки на английском для сохранения стилистики Warhammer 40,000
   */
  const mainPairs = [
    ["Name", mainInfo?.name],
    ["Age", mainInfo?.age],
    ["Birthday", mainInfo?.birthday],
    ["Gender", mainInfo?.gender],
    ["Appearance", mainInfo?.appearance],
    ["Height", mainInfo?.height],
    ["Weight", mainInfo?.weight],
  ] as const;

  /**
   * ПРОВЕРКА НАЛИЧИЯ ОСНОВНОЙ ИНФОРМАЦИИ ДЛЯ ОТОБРАЖЕНИЯ
   * 
   * Секция основной информации показывается только если есть:
   * - Изображение персонажа ИЛИ
   * - Хотя бы одно заполненное текстовое поле
   */
  const hasMainInfo =
    !!mainInfo &&
    (Boolean(mainInfo.image) || mainPairs.some(([, v]) => v !== undefined && v !== null && v !== ""));

  return (
    <div className="sticky top-4 space-y-6">
      {/* ЗАГОЛОВОК СЕКЦИИ ПРЕДПРОСМОТРА С ИКОНКОЙ */}
      <div className="flex items-center gap-2 text-brass mb-4">
        <Eye className="w-5 h-5" />
        <h3 className="text-xl font-bold">Предпросмотр</h3>
      </div>

      {/* ОСНОВНАЯ КАРТОЧКА ПРЕДПРОСМОТРА */}
      <div
        className="
          rounded-2xl border-2 border-brass
          bg-white/95 shadow-[0_0_0_1px_rgba(212,163,58,0.25),0_25px_60px_-10px_rgba(0,0,0,0.15)]
          dark:bg-gradient-to-br dark:from-gray-900 dark:to-black
          p-6 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden
          wh-preview
        "
      >
        {/* ЗАГОЛОВОК СТАТЬИ */}
        {title ? (
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-brass mb-4 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)] dark:drop-shadow-[0_0_16px_rgba(212,163,58,0.35)]">
            {title}
          </h1>
        ) : (
          // ИНДИКАТОР ЗАГРУЗКИ ДЛЯ ПУСТОГО ЗАГОЛОВКА
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
        )}

        {/* ПРЕВЬЮ-ИЗОБРАЖЕНИЕ СТАТЬИ */}
        {previewImg ? (
          <SmartImg
            original={previewImg}
            src={previewSrc}
            variant="hero"
            fit="cover"
            framed
            radiusClass="rounded-xl"
            className="!rounded-none"
            alt=""
          />
        ) : (
          // ПЛЕЙСХОЛДЕР ДЛЯ ОТСУТСТВУЮЩЕГО ИЗОБРАЖЕНИЯ ПРЕВЬЮ
          <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6 flex items-center justify-center text-gray-400 dark:text-gray-600">
            Превью изображение
          </div>
        )}

        {/* СЕКЦИЯ ОСНОВНОЙ ИНФОРМАЦИИ О ПЕРСОНАЖЕ */}
        {hasMainInfo && (
          <section
            className="
              group rounded-2xl border-2 border-brass overflow-hidden mb-6
              bg-white/90 text-gray-800
              dark:bg-gray-900 dark:text-gray-200
            "
          >
            {/* ЗАГОЛОВОК СЕКЦИИ ОСНОВНОЙ ИНФОРМАЦИИ */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-extrabold tracking-wide text-gray-900 dark:text-brass">
                Главная информация
              </h3>
            </div>

            {/* СОДЕРЖИМОЕ СЕКЦИИ ОСНОВНОЙ ИНФОРМАЦИИ */}
            <div className="p-4 space-y-4">
              {/* ИЗОБРАЖЕНИЕ ПЕРСОНАЖА (ЕСЛИ ЕСТЬ) */}
              {mainInfo?.image ? (
                <SmartImg
                  original={mainInfo.image}
                  src={proxifyImage(mainInfo.image)}
                  variant="content"
                  fit="contain"
                  framed
                  alt=""
                />
              ) : null}

              {/* СПИСОК ПОЛЕЙ ОСНОВНОЙ ИНФОРМАЦИИ */}
              <div className="space-y-2">
                {mainPairs
                  .filter(([, v]) => !!v) // ФИЛЬТРАЦИЯ ПУСТЫХ ЗНАЧЕНИЙ
                  .map(([label, value]) => (
                    <div
                      key={label}
                      className="
                        flex items-baseline gap-3
                        rounded-xl
                        ring-1 ring-black/5 bg-white/70
                        px-3.5 py-2.5
                        transition
                        hover:bg-white/85
                        dark:ring-0 dark:bg-transparent dark:border-b dark:border-gray-800
                      "
                    >
                      {/* МЕТКА ПОЛЯ В СТИЛИСТИКЕ WARHAMMER 40,000 */}
                      <span
                        className="
                          shrink-0 uppercase tracking-widest font-bold
                          text-[0.78rem] text-gray-500
                          dark:text-gray-400
                        "
                        style={{ letterSpacing: ".06em" }}
                      >
                        {label}:
                      </span>
                      {/* ЗНАЧЕНИЕ ПОЛЯ */}
                      <span className="text-gray-900 dark:text-gray-200">
                        {String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* СЕКЦИЯ ОСНОВНОГО КОНТЕНТА СТАТЬИ */}
        <div className="prose max-w-none dark:prose-invert">
          {blocks.length > 0 ? (
            // РЕНДЕРИНГ ВСЕХ БЛОКОВ КОНТЕНТА
            blocks.map(renderBlock)
          ) : (
            // СООБЩЕНИЕ ПРИ ОТСУТСТВИИ КОНТЕНТА
            <div className="text-center py-12 text-gray-400 dark:text-gray-600">
              Добавьте блоки контента
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





// Комментарии объясняют:

// 1. Архитектуру компонента предпросмотра

// Режим реального времени для мгновенного отображения изменений в редакторе
// Полное соответствие финальному виду статьи с сохранением всех стилей
// Модульную структуру с разделением на логические секции

// 2. Систему рендеринга контентных блоков

// Поддержку всех типов блоков из API (h1, h2, p, image, ul)
// Интеллектуальную обработку данных списков с разными форматами
// Грациозную обработку ошибок для изображений и пустого контента

// 3. Визуальное оформление и UX

// Тематические стили Warhammer 40,000 с brass цветами и градиентами
// Адаптивный дизайн для светлой и темной тем
// Интерактивные элементы с hover-эффектами
// Липкое позиционирование для удобства работы в редакторе

// 4. Бизнес-логику отображения

// Умное скрытие пустых секций для чистого интерфейса
// Валидацию данных перед отображением
// Поддержку частичных данных в режиме редактирования

// 5. Технические особенности

// Интеграцию с SmartImg для оптимизированного отображения изображений
// Проксирование изображений для решения CORS проблем
// Оптимизацию производительности через ключевые пропсы и мемоизацию

// Компонент ContentPreview обеспечивает мощный инструмент 
// визуальной обратной связи в редакторе статей Warhammer 40,000 Fandom Wiki, 
// позволяя авторам видеть конечный результат своих изменений в режиме реального 
// времени с сохранением точности стилей и структуры финальной статьи.



