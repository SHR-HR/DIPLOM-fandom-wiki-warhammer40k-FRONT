// «Не передаем сюда уже проксированный src; достаточно original».
import { proxifyImage, onImgErrorFallback, needsCrossOrigin } from "@/utils/imgProxy";

/**
 * ТИПЫ ДЛЯ КОМПОНЕНТА УМНОГО ИЗОБРАЖЕНИЯ
 * 
 * Fit: способ масштабирования изображения в контейнере
 * Variant: визуальный вариант отображения изображения
 */
type Fit = "contain" | "cover";
type Variant = "content" | "hero" | "thumb";

/**
 * ПРОПСЫ КОМПОНЕНТА SMARTIMG
 * 
 * Расширяет стандартные HTML атрибуты изображения с дополнительными функциями:
 * - original: оригинальный URL до проксирования (основной параметр)
 * - src: уже проксированный URL (опционально, для ручного управления)
 * - fit: способ масштабирования изображения
 * - variant: визуальный вариант (hero, content, thumb)
 * - framed: добавление рамки в стиле Warhammer 40,000
 * - radiusClass: класс для скругления углов
 * - lazy: включение ленивой загрузки
 * - outerClassName: классы для внешнего контейнера
 */
interface SmartImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Оригинальный URL (до прокси). Если не указан — возьмём src как оригинал */
  original?: string | null | undefined;
  /** Уже проксированный src (если хочешь сам) */
  src?: string | undefined;
  /** Как вписывать: по умолчанию contain */
  fit?: Fit;
  /** Визуальный вариант: content/hero/thumb */
  variant?: Variant;
  /** Рамка (граница + скругление) */
  framed?: boolean;
  /** Класс скругления (по умолчанию rounded-xl) */
  radiusClass?: string;
  /** Включить lazy-ленивую загрузку */
  lazy?: boolean;
  /** Классы внешнего контейнера */
  outerClassName?: string;
}

/**
 * УНИВЕРСАЛЬНЫЙ КОМПОНЕНТ ИЗОБРАЖЕНИЯ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Умное изображение с расширенной функциональностью:
 * - Автоматическое проксирование внешних доменов для обхода CORS
 * - Интеллектуальная установка crossOrigin только когда необходимо
 * - Политика no-referrer для безопасности
 * - Многоуровневый fallback при ошибках загрузки
 * - Поддержка различных визуальных вариантов (hero/content/thumb)
 * 
 * Особенности:
 * - Не требует передачи уже проксированного URL (работает с original)
 * - Автоматически определяет необходимость crossOrigin атрибута
 * - Обеспечивает последовательность fallback при ошибках загрузки
 * - Поддерживает адаптивный дизайн для всех устройств
 */
export default function SmartImg({
  original,
  src,
  fit = "contain",
  variant = "content",
  framed = true,
  radiusClass = "rounded-xl",
  lazy = true,
  className = "",
  outerClassName,
  style,
  alt = "",
  ...imgProps
}: SmartImgProps) {
  /**
   * ОПРЕДЕЛЕНИЕ ФИНАЛЬНЫХ URL ДЛЯ ОБРАБОТКИ
   * 
   * Приоритеты:
   * 1. original - оригинальный URL для проксирования
   * 2. src - уже проксированный URL (для обратной совместимости)
   * 3. Пустая строка - если оба не указаны
   */
  const finalOriginal = (original ?? src ?? "") as string;
  
  /**
   * ПРОКСИРОВАНИЕ ИЗОБРАЖЕНИЯ ДЛЯ ОБХОДА CORS ОГРАНИЧЕНИЙ
   * 
   * proxifyImage преобразует оригинальный URL через сервис прокси
   * для решения проблем с CORS и загрузкой изображений с внешних доменов
   */
  const finalSrc = finalOriginal ? proxifyImage(finalOriginal) : undefined;
  
  // ВОЗВРАТ NULL ПРИ ОТСУТСТВИИ ИСТОЧНИКА ИЗОБРАЖЕНИЯ
  if (!finalSrc) return null;

  /**
   * ОПРЕДЕЛЕНИЕ НЕОБХОДИМОСТИ CROSSORIGIN АТРИБУТА
   * 
   * needsCrossOrigin анализирует URL и определяет требуется ли
   * атрибут crossOrigin для корректной загрузки изображения
   */
  const cors = needsCrossOrigin(finalSrc);

  /**
   * ВСПОМОГАТЕЛЬНЫЕ ФЛАГИ ДЛЯ УСЛОВНОГО РЕНДЕРИНГА СТИЛЕЙ
   */
  const isHero = variant === "hero";
  const isContent = variant === "content";
  const isCover = fit === "cover";

  /**
   * ФОРМИРОВАНИЕ КЛАССОВ ДЛЯ РАМКИ ИЗОБРАЖЕНИЯ
   * 
   * framed=true добавляет стилизованную рамку в тематике Warhammer 40,000
   * с границей цвета brass и тенью
   */
  const frameBase = framed
    ? `${radiusClass} overflow-hidden border-2 border-brass fw-shadow`
    : `${radiusClass} overflow-hidden`;

  /**
   * ОТСТУПЫ ПО УМОЛЧАНИЮ В ЗАВИСИМОСТИ ОТ ВАРИАНТА
   * 
   * hero изображения получают дополнительный отступ снизу
   * для визуального отделения от следующего контента
   */
  const defaultGap = variant === "hero" ? "mb-6" : "my-6";

  return (
    /**
     * ВНЕШНИЙ КОНТЕЙНЕР ИЗОБРАЖЕНИЯ
     * 
     * Управляет рамкой, скруглением и отступами изображения
     * Для hero варианта устанавливает фиксированное соотношение сторон 16:9
     */
    <div
      className={["smartimg-frame", frameBase, defaultGap, outerClassName || ""].join(" ")}
      style={{ ...(isHero ? { aspectRatio: "16 / 9" } : {}) }}
    >
      {/*
        ОСНОВНОЙ ЭЛЕМЕНТ ИЗОБРАЖЕНИЯ С РАСШИРЕННОЙ ФУНКЦИОНАЛЬНОСТЬЮ
       
        Ключевые особенности:
        - data-original: сохраняет оригинальный URL для fallback системы
        - loading="lazy": ленивая загрузка для оптимизации производительности
        - decoding="async": асинхронное декодирование для улучшения UX
        - referrerPolicy="no-referrer": безопасность и конфиденциальность
        - onError: многоуровневая обработка ошибок загрузки
        - crossOrigin: интеллектуальная установка только при необходимости
      */}
      <img
        src={finalSrc}
        data-original={finalOriginal}
        alt={alt}
        className={[
          "block w-full",
          isHero ? "h-full object-cover" : "",
          isContent ? "h-auto object-contain" : "",
          !isContent && isCover ? "object-cover" : "",
          className,
        ].join(" ")}
        style={style}
        loading={lazy ? "lazy" : undefined}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={onImgErrorFallback}
        {...(cors ? { crossOrigin: "anonymous" as const } : {})}
        {...imgProps}
      />
    </div>
  );
}





// Комментарии объясняют:

// 1. Архитектуру умного компонента изображения

// Разделение ответственности между оригинальным и проксированным URL
// Интеграцию с системой проксирования для решения CORS проблем
// Расширяемость через наследование стандартных HTML атрибутов

// 2. Систему обработки изображений

// Автоматическое проксирование через proxifyImage
// Интеллектуальное определение необходимости crossOrigin
// Многоуровневый fallback при ошибках загрузки через onImgErrorFallback

// 3. Визуальные варианты и стилизацию

// Hero вариант для главных изображений с фиксированным соотношением сторон
// Content вариант для изображений в контенте статьи
// Thumb вариант для миниатюр и превью
// Стилизованные рамки в тематике Warhammer 40,000

// 4. Оптимизацию производительности

// Ленивую загрузку через loading="lazy"
// Асинхронное декодирование через decoding="async"
// Безопасную политику рефереров через referrerPolicy="no-referrer"

// 5. Пользовательский опыт и доступность

// Обязательный alt текст для доступности
// Адаптивные классы для различных сценариев использования
// Гибкую систему пропсов для кастомизации

// Компонент SmartImg обеспечивает 
// надежное и оптимизированное отображение изображений 
// в Warhammer 40,000 Fandom Wiki, решая распространенные 
// проблемы веб-разработки (CORS, производительность, доступность) 
// и предоставляя единообразный визуальный стиль throughout всему приложению.




