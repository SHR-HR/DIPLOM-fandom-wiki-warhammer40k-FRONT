import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchById } from "@/features/articles/articlesSlice";
import ArticleView from "@/features/articles/ArticleView";
import { ArrowLeft, Edit3 } from "lucide-react";
import { seedFullArticles } from "@/seed/fullArticles";
import type { ApiArticle } from "@/models/api";

/**
 * КОМПОНЕНТ СТРАНИЦЫ СТАТЬИ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Отображает полную версию статьи с возможностью редактирования для автора
 * Объединяет данные из Redux store и локальных seed-данных для гибкости разработки
 */
export default function ArticlePage() {
  // Получаем ID статьи из параметров URL (например: /article/123)
  const { id } = useParams();

  /**
   * ПРЕОБРАЗОВАНИЕ ID ИЗ СТРОКИ В ЧИСЛО С ПРОВЕРКОЙ
   * 
   * useMemo для оптимизации - пересчитывается только при изменении id
   * Number.isFinite проверяет что это конечное число (не NaN, не Infinity)
   */
  const articleId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : NaN;
  }, [id]);

  // Получаем dispatch для отправки actions в Redux store
  const d = useAppDispatch();

  // Флаг авторизации пользователя из Redux store
  const isAuthed = useAppSelector((s) => s.auth.isAuthed);

  /**
   * ДАННЫЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
   * 
   * Используется для проверки прав редактирования
   * me объект содержит нормализованный ID пользователя
   */
  const me = useAppSelector((s) => s.auth.me);

  /**
   * СТАТЬЯ ИЗ REDUX STORE (ЗАГРУЖЕННАЯ ЧЕРЕЗ API)
   * 
   * Достаем статью по ID из нормализованного хранилища articles.byId
   * Типизация as ApiArticle | undefined для безопасности
   */
  const fromStore = useAppSelector(
    (s) => s.articles.byId[articleId] as ApiArticle | undefined
  );

  /**
   * СТАТЬЯ ИЗ ЛОКАЛЬНЫХ SEED-ДАННЫХ (ДЛЯ РАЗРАБОТКИ)
   * 
   * Используется когда нет доступа к API или для демонстрации
   * Приведение типа для TypeScript безопасности
   */
  const seeded = (seedFullArticles as Record<number, ApiArticle | undefined>)[
    articleId
  ];

  /**
   * ПРИОРИТЕТНАЯ СТРАТЕГИЯ ВЫБОРА СТАТЬИ
   * 
   * Сначала пытаемся взять статью из Redux store (актуальные данные с API)
   * Если в store нет - используем seed-данные (для разработки/демо)
   * Nullish coalescing operator (??) не учитывает undefined/null
   */
  const art: ApiArticle | undefined = fromStore ?? seeded;

  /**
   * ЭФФЕКТ ДЛЯ ЗАГРУЗКИ СТАТЬИ С API ПРИ НЕОБХОДИМОСТИ
   * 
   * Условия выполнения запроса:
   * 1. articleId должен быть валидным числом
   * 2. Статьи нет в seed-данных (чтобы не делать лишний запрос)
   * 3. Статьи нет в Redux store (чтобы не загружать повторно)
   */
  useEffect(() => {
    if (!Number.isFinite(articleId)) return;
    if (seeded) return;
    if (!fromStore) d(fetchById(articleId));
  }, [articleId, seeded, fromStore, d]);

  /**
   * ПРОВЕРКА ПРАВ НА РЕДАКТИРОВАНИЕ СТАТЬИ
   * 
   * Условия для отображения кнопки "Редактировать":
   * 1. Пользователь авторизован (isAuthed = true)
   * 2. Есть данные профиля (me не undefined)
   * 3. Статья существует (art не undefined)
   * 4. У статьи есть author_id (проверка типа number)
   * 5. ID автора статьи совпадает с ID текущего пользователя
   * 
   * Boolean() преобразует результат в чистый boolean
   */
  const canEdit = Boolean(
    isAuthed &&
      me &&
      art &&
      typeof art.author_id === "number" &&
      me.id === art.author_id
  );

  /**
   * ОБРАБОТКА НЕВАЛИДНОГО ID СТАТЬИ
   * 
   * Показываем сообщение об ошибке если:
   * - ID не число
   * - ID NaN или Infinity
   */
  if (!Number.isFinite(articleId)) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-400">
        Неверный идентификатор статьи
      </div>
    );
  }

  /**
   * СОСТОЯНИЕ ЗАГРУЗКИ СТАТЬИ
   * 
   * Показываем индикатор загрузки если:
   * - Статьи нет ни в store, ни в seed-данных
   * - Запрос к API еще выполняется
   */
  if (!art) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        {/* Анимированный спиннер в стилистике Warhammer */}
        <div className="inline-block w-12 h-12 border-4 border-brass border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-400">Загрузка статьи…</p>
      </div>
    );
  }

  /**
   * ОСНОВНОЙ РЕНДЕРИНГ СТРАНИЦЫ СТАТЬИ
   * 
   * Отображает:
   * - Заголовок и мета-информацию
   * - Кнопку "Назад" для навигации
   * - Кнопку "Редактировать" (только для автора)
   * - Компонент с содержимым статьи
   */
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* ШАПКА СТРАНИЦЫ С НАВИГАЦИЕЙ И ДЕЙСТВИЯМИ */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Блок с заголовком и навигацией */}
        <div>
          {/* Кнопка "Назад" к списку статей */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-brass hover:text-yellow-400 transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к списку
          </Link>
          {/* Основной заголовок статьи */}
          <h1 className="text-3xl font-bold text-brass">{art.title}</h1>
          {/* Информация об авторе (если доступна) */}
          {art.author && (
            <p className="text-gray-400 text-sm mt-1">Автор: {art.author}</p>
          )}
        </div>

        {/* КНОПКА РЕДАКТИРОВАНИЯ (ВИДНА ТОЛЬКО АВТОРУ) */}
        {canEdit && (
          <Link
            to={`/edit/${art.id}`}
            className="
              inline-flex items-center gap-2 px-4 py-2
              rounded-lg border-2 border-brass
            bg-black text-white
            hover:bg-brass hover:text-black
              transition
            "
            title="Редактировать статью"
          >
            <Edit3 className="w-4 h-4" />
            Редактировать
          </Link>
        )}
      </header>

      {/* КОМПОНЕНТ ОТОБРАЖЕНИЯ СОДЕРЖИМОГО СТАТЬИ */}
      <ArticleView article={art} />
    </div>
  );
}


// Комментарии объясняют:

// 1. Логику работы с данными

// Стратегия выбора статьи (store → seed-данные)
// Условия загрузки данных с API
// Приоритеты источников данных

// 2. Систему прав доступа

// Проверка авторства для редактирования
// Условия отображения кнопки редактирования
// Безопасность типов при работе с ID

// 3. Состояния интерфейса

// Загрузка (спиннер)
// Ошибка (невалидный ID)
// Успешное отображение

// 4. Архитектурные решения

// Использование useMemo для оптимизации
// Эффекты с условиями выполнения
// Нормализованная структура store

// 5. Пользовательский опыт

// Навигация между страницами
// Визуальная обратная связь
// Адаптивный дизайн

// Компонент обеспечивает полный цикл работы со статьей: 
// от загрузки данных до управления правами доступа!




