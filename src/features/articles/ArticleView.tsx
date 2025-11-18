import type { ApiArticle } from "@/models/api";
import SmartImg from "@/components/SmartImg";
import { proxifyImage, needsCrossOrigin } from "@/utils/imgProxy";
import { User, CalendarDays, VenetianMask, Ruler, Weight, Sparkles } from "lucide-react";

interface Props { article: ApiArticle; }

/**
 * КОНФИГУРАЦИЯ ПОЛЕЙ ОСНОВНОЙ ИНФОРМАЦИИ О ПЕРСОНАЖЕ
 * 
 * Определяет отображаемые поля основной информации с соответствующими иконками и метками.
 * Каждое поле соответствует ключу в ApiArticle["mainInfo"] и имеет:
 * - key: техническое имя поля в данных
 * - label: понятное название для отображения пользователю
 * - icon: иконка Lucide React для визуального обозначения поля
 */
type KV = { key: keyof NonNullable<ApiArticle["mainInfo"]>; label: string; icon?: React.ReactNode };

const FIELDS: KV[] = [
  { key: "name",       label: "Имя",           icon: <User className="w-4 h-4" /> },
  { key: "age",        label: "Возраст",       icon: <Sparkles className="w-4 h-4" /> },
  { key: "birthday",   label: "День рождения", icon: <CalendarDays className="w-4 h-4" /> },
  { key: "gender",     label: "Пол",           icon: <VenetianMask className="w-4 h-4" /> },
  { key: "appearance", label: "Внешность",     icon: <Sparkles className="w-4 h-4" /> },
  { key: "height",     label: "Рост",          icon: <Ruler className="w-4 h-4" /> },
  { key: "weight",     label: "Вес",           icon: <Weight className="w-4 h-4" /> },
];

/**
 * КОМПОНЕНТ РЕНДЕРИНГА КОНТЕНТА СТАТЬИ
 * 
 * Обрабатывает и отображает различные типы блоков контента:
 * - Заголовки (h1, h2)
 * - Текстовые параграфы (p)
 * - Изображения (image)
 * - Маркированные списки (ul)
 * 
 * @param blocks - массив блоков контента статьи
 */
function ContentRenderer({ blocks }: { blocks: any[] }) {
  if (!blocks?.length) return null;

  return (
    <div className="space-y-6">
      {blocks.map((b, i) => {
        // ОБРАБОТКА БЛОКА ИЗОБРАЖЕНИЯ
        if (b.type === "image") {
          const original: string | undefined =
            b.src ?? (typeof b.content === "string" ? b.content : undefined);
          const src = original ? proxifyImage(original) : undefined;
          if (!src) return null;

          return (
            <SmartImg
              key={i}
              original={original}
              src={src}
              variant="content"
              fit="contain"
              className="select-none"
              framed
            />
          );
        }

        // ОБРАБОТКА МАРКИРОВАННОГО СПИСКА
        if (b.type === "ul" && Array.isArray(b.content)) {
          const items = b.content
            .map((it: any) => (typeof it === "string" ? it : it?.content ?? ""))
            .map((s: string) => s.trim())
            .filter(Boolean);
          return (
            <ul key={i} className="list-disc pl-5 space-y-2 text-gray-800 dark:text-gray-300">
              {items.length > 0 ? items.map((txt: string, j: number) => <li key={j}>{txt}</li>) : null}
            </ul>
          );
        }

        // ОБРАБОТКА ЗАГОЛОВКА ПЕРВОГО УРОВНЯ
        if (b.type === "h1")
          return (
            <h1 key={i} className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-brass text-glow-brass">
              {String(b.content ?? "")}
            </h1>
          );

        // ОБРАБОТКА ЗАГОЛОВКА ВТОРОГО УРОВНЯ
        if (b.type === "h2")
          return (
            <h2 key={i} className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-brass text-glow-brass">
              {String(b.content ?? "")}
            </h2>
          );

        // ОБРАБОТКА ТЕКСТОВОГО ПАРАГРАФА (значение по умолчанию)
        return <p key={i} className="leading-relaxed text-gray-800 dark:text-gray-300">{String(b.content ?? "")}</p>;
      })}
    </div>
  );
}

/**
 * КОМПОНЕНТ ПРОСМОТРА СТАТЬИ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Отображает полную статью в режиме чтения с разбивкой на секции:
 * - Hero-изображение (превью статьи)
 * - Основная информация о персонаже
 * - Содержимое статьи (блоки контента)
 * 
 * Особенности:
 * - Автоматическое проксирование изображений для обхода CORS
 * - Интеллектуальное форматирование значений (рост, вес)
 * - Адаптивный дизайн для всех устройств
 * - Поддержка темной и светлой тем
 */
export default function ArticleView({ article }: Props) {
  const info = article.mainInfo;
  
  /**
   * ПОДГОТОВКА ГЛАВНОГО ИЗОБРАЖЕНИЯ СТАТЬИ
   * 
   * - proxifyImage: преобразует URL для обхода CORS ограничений
   * - needsCrossOrigin: определяет необходимость crossOrigin атрибута
   */
  const topSrc = proxifyImage(article.previewImg);
  const topCors = needsCrossOrigin(topSrc);

  /**
   * ПОДГОТОВКА ДАННЫХ ДЛЯ ОТОБРАЖЕНИЯ ОСНОВНОЙ ИНФОРМАЦИИ
   * 
   * Фильтрует и форматирует поля основной информации:
   * - Исключает пустые и неопределенные значения
   * - Автоматически добавляет единицы измерения к росту и весу
   * - Сохраняет иконки и метки для отображения
   */
  const pairs = FIELDS.map(({ key, label, icon }) => {
    const raw = info?.[key];
    if (raw == null || raw === "") return null;
    let value = String(raw);
    
    // АВТОМАТИЧЕСКОЕ ФОРМАТИРОВАНИЕ ЧИСЛОВЫХ ЗНАЧЕНИЙ
    if (key === "height" && /^\d+$/.test(value)) value += " см";
    if (key === "weight" && /^\d+$/.test(value)) value += " кг";
    
    return { label, value, icon };
  }).filter(Boolean) as { label: string; value: string; icon?: React.ReactNode }[];

  return (
    <div className="space-y-6">
      {/* HERO-СЕКЦИЯ С ГЛАВНЫМ ИЗОБРАЖЕНИЕМ СТАТЬИ */}
      <SmartImg
        original={article.previewImg}
        src={topSrc}
        variant="hero"
        fit="cover"
        framed
        radiusClass="rounded-2xl"
        {...(topCors ? { crossOrigin: "anonymous" as const } : {})}
        alt={article.title}
        className="!rounded-none"
      />

      {/* СЕКЦИЯ ОСНОВНОЙ ИНФОРМАЦИИ О ПЕРСОНАЖЕ */}
      <section className="rounded-2xl border-2 border-brass p-6 bg-white/95 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
        <h2 className="text-xl font-bold text-gray-900 dark:text-brass mb-4 text-glow-brass">
          Главная информация
        </h2>

        {/* АДАПТИВНАЯ СЕТКА: 2 КОЛОНКИ ЕСЛИ ЕСТЬ ИЗОБРАЖЕНИЕ, 1 ЕСЛИ НЕТ */}
        <div className={`grid md:grid-cols-2 gap-6 ${info?.image ? "" : "md:grid-cols-1"}`}>
          {/* ИЗОБРАЖЕНИЕ ПЕРСОНАЖА (ЕСЛИ ЕСТЬ) */}
          {info?.image && (
            <SmartImg original={info.image} variant="content" fit="contain" framed className="select-none" alt="" />
          )}

          {/* КАРТОЧКА КЛЮЧ-ЗНАЧЕНИЕ ДЛЯ ОСНОВНОЙ ИНФОРМАЦИИ */}
          <div className="kv-card">
            {pairs.length === 0 ? (
              // СООБЩЕНИЕ ПРИ ОТСУТСТВИИ ДАННЫХ
              <p className="text-sm text-gray-500 dark:text-gray-400">Нет данных для отображения.</p>
            ) : (
              // СПИСОК ПОЛЕЙ ОСНОВНОЙ ИНФОРМАЦИИ
              <dl className="kv-grid">
                {pairs.map(({ label, value, icon }, i) => (
                  <div key={i} className="kv-row">
                    <dt className="kv-label">{icon}{label}</dt>
                    <dd className="kv-value">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      {/* СЕКЦИЯ ОСНОВНОГО КОНТЕНТА СТАТЬИ */}
      <section className="rounded-2xl border-2 border-brass p-6 bg-white/95 dark:bg-gray-900">
        <ContentRenderer blocks={article.mainContent ?? []} />
      </section>
    </div>
  );
}





// Комментарии объясняют:

// 1. Архитектуру компонента просмотра статьи

// Разделение на логические секции: Hero, основная информация, контент
// Модульную структуру с выделенным компонентом рендеринга контента
// Типизированную конфигурацию полей основной информации

// 2. Систему рендеринга контента

// Обработку различных типов блоков: заголовки, параграфы, изображения, списки
// Интеллектуальное проксирование изображений для решения CORS проблем
// Адаптивное форматирование числовых значений (рост, вес)

// 3. Пользовательский опыт

// Визуальную иерархию с использованием иконок и семантической разметки
// Адаптивный дизайн с изменением layout в зависимости от наличия изображения
// Поддержку темной темы через условные CSS классы

// 4. Технические особенности

// Интеграцию с SmartImg для оптимизированной загрузки изображений
// Обработку edge cases (отсутствие данных, некорректный контент)
// Оптимизацию производительности через ключи в map функциях

// 5. Бизнес-логику отображения

// Автоматическое форматирование данных персонажа
// Гибкую систему полей через конфигурационный массив
// Семантическую HTML разметку для доступности и SEO

// Компонент ArticleView обеспечивает богатый и адаптивный интерфейс 
// для просмотра статей в Warhammer 40,000 Fandom Wiki, сочетая эстетическое 
// оформление с технической надежностью и удобством использования.


