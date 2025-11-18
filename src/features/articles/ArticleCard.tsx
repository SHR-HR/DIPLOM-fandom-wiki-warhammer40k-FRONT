import { Link } from "react-router-dom";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { ApiArticleShort } from "@/models/api";
import {
  proxifyImage,
  onImgErrorFallback,
  needsCrossOrigin,
  PLACEHOLDER,
} from "@/utils/imgProxy";

/**
 * ПРОПСЫ КОМПОНЕНТА КАРТОЧКИ СТАТЬИ
 * 
 * @property article - объект с краткой информацией о статье для отображения в карточке
 */
interface Props {
  article: ApiArticleShort;
}

/**
 * КОМПОНЕНТ КАРТОЧКИ СТАТЬИ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Отображает компактную карточку статьи с:
 * - Превью-изображением с обработкой ошибок загрузки
 * - Заголовком статьи
 * - Ссылкой на полную версию статьи
 * - Анимациями и эффектами при наведении
 * 
 * Особенности:
 * - Интеллектуальная обработка изображений с проксированием и fallback
 * - Адаптивный дизайн для всех устройств
 * - Поддержка темной и светлой тем
 * - Визуальные эффекты в стиле Warhammer 40,000
 */
export default function ArticleCard({ article }: Props) {
  /**
   * СОСТОЯНИЕ ОШИБКИ ЗАГРУЗКИ ИЗОБРАЖЕНИЯ
   * 
   * Отслеживает, было ли основное изображение заменено на плейсхолдер
   * из-за ошибки загрузки, чтобы показать дополнительный визуальный индикатор
   */
  const [broken, setBroken] = useState(false);

  /**
   * ПОДГОТОВКА ИЗОБРАЖЕНИЯ ДЛЯ ОТОБРАЖЕНИЯ
   * 
   * - proxifyImage: преобразует URL для обхода CORS ограничений
   * - needsCrossOrigin: определяет необходимость crossOrigin атрибута
   */
  const src = proxifyImage(article.previewImg);
  const cors = needsCrossOrigin(src);

  return (
    /**
     * КАРТОЧКА СТАТЬИ КАК ССЫЛКА НА СТРАНИЦУ СТАТЬИ
     * 
     * Оборачивает весь контент в Link для навигации с помощью React Router
     * Применяет различные эффекты при наведении для улучшения UX
     */
    <Link
      to={`/article/${article.id}`}
      className="group block rounded-2xl border-2 border-brass overflow-hidden bg-black dark:bg-black light:bg-white hover:scale-105 hover:shadow-[0_0_30px_rgba(180,141,87,0.4)] transition-all duration-300 gothic-border shadow-lg"
    >
      {/* КОНТЕЙНЕР ИЗОБРАЖЕНИЯ С ОПРЕДЕЛЕННЫМ СООТНОШЕНИЕМ СТОРОН */}
      <div className="aspect-video overflow-hidden bg-gradient-to-br from-gray-900 to-black dark:from-gray-900 dark:to-black light:from-gray-200 light:to-gray-300 relative">
        {/* 
          ОСНОВНОЕ ИЗОБРАЖЕНИЕ ПРЕВЬЮ СТАТЬИ
          С комплексной обработкой загрузки и ошибок
        */}
        <img
          src={src}
          data-original={article.previewImg || ""}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={onImgErrorFallback}
          onLoad={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            // Если загрузился итоговый плейсхолдер — показываем оверлей
            setBroken(el.src === PLACEHOLDER);
          }}
          {...(cors ? { crossOrigin: "anonymous" as const } : {})}
        />

        {/* 
          ГРАДИЕНТНЫЙ НАЛОЖЕНИЕ ДЛЯ УЛУЧШЕНИЯ ЧИТАЕМОСТИ ТЕКСТА
          Создает плавный переход от изображения к содержимому карточки
        */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>

        {/* 
          ВИЗУАЛЬНЫЙ ИНДИКАТОР НЕДОСТУПНОСТИ ИЗОБРАЖЕНИЯ
          Показывается только когда изображение не удалось загрузить
          и было заменено на плейсхолдер
        */}
        {broken && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-brass">
            <ImageOff className="w-16 h-16 mb-2 opacity-50" />
            <span className="text-sm opacity-75">Изображение недоступно</span>
          </div>
        )}
      </div>

      {/* 
        КОНТЕЙНЕР ЗАГОЛОВКА СТАТЬИ
        С градиентным фоном и стилизацией в тематике Warhammer 40,000
      */}
      <div className="p-4 bg-gradient-to-b from-gray-950 to-black dark:from-gray-950 dark:to-black light:from-gray-50 light:to-gray-100">
        <h3 className="font-bold text-lg text-brass group-hover:text-yellow-400 transition tracking-wide drop-shadow-[0_0_10px_rgba(180,141,87,0.5)]">
          {article.title}
        </h3>
      </div>
    </Link>
  );
}






// Комментарии объясняют:

// 1. Архитектуру карточки статьи

// Комплексную обработку изображений с проксированием и fallback механизмами
// Состояние отслеживания ошибок для улучшения пользовательского опыта
// Интеграцию с системой маршрутизации через React Router Link

// 2. Систему обработки изображений

// Автоматическое проксирование для решения CORS проблем
// Ленивую загрузку для оптимизации производительности
// Умный fallback при ошибках загрузки изображений
// Определение необходимости crossOrigin атрибута

// 3. Визуальный дизайн и анимации

// Эффекты при наведении: увеличение карточки и изображения, свечение
// Градиентные наложения для улучшения читаемости текста
// Тематическое оформление в стиле Warhammer 40,000 (brass цвета)
// Адаптивность для светлой и темной тем

// 4. Пользовательский опыт

// Визуальную обратную связь при наведении и взаимодействии
// Четкие индикаторы проблем с загрузкой контента
// Плавные переходы между состояниями

// 5. Технические особенности

// Оптимизацию производительности через lazy loading
// Безопасность через referrerPolicy
// Семантическую разметку для доступности и SEO

// Компонент ArticleCard обеспечивает визуально привлекательный 
// и функциональный способ отображения статей в Warhammer 40,000 Fandom Wiki, 
// сочетая современные веб-технологии с тематическим дизайном вселенной Warhammer 40,000.




