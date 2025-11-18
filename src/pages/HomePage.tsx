import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchList } from "@/features/articles/articlesSlice";
import SearchInput from "@/features/ui/SearchInput";
import SortControl from "@/features/ui/SortControl";
import Paginator from "@/features/ui/Paginator";
import ArticleList from "@/features/articles/ArticleList";
import { Shield, Book, Skull } from "lucide-react";

/**
 * ГЛАВНАЯ СТРАНИЦА WARHAMMER 40,000 FANDOM WIKI
 * 
 * Основная страница приложения с:
 * - Героическим заголовком в тематике вселенной
 * - Поиском и сортировкой статей
 * - Списком статей с пагинацией
 * - Обработкой состояний загрузки и ошибок
 */
export default function HomePage() {
  // Получаем dispatch для отправки actions в Redux store
  const d = useAppDispatch();

  /**
   * ДАННЫЕ ИЗ REDUX STORE
   * 
   * - list: массив статей для отображения
   * - loading: флаг загрузки данных
   * - error: текст ошибки (если есть)
   * - total: общее количество статей (для пагинации)
   */
  const { list, loading, error, total } = useAppSelector((s) => s.articles);
  
  /**
   * ПАРАМЕТРЫ UI ИЗ REDUX STORE
   * 
   * - search: поисковый запрос
   * - start: начальная позиция для пагинации
   * - limit: количество статей на странице
   * - sort: текущая сортировка
   */
  const { search, start, limit, sort } = useAppSelector((s) => s.ui);

  /**
   * ПРЕОБРАЗОВАНИЕ ПАРАМЕТРОВ СОРТИРОВКИ UI → API
   * 
   * Маппинг значений интерфейса в параметры для серверного API
   * @param key - ключ сортировки из UI
   * @returns объект с параметрами для API
   */
  const mapSort = (key: string): { sort?: "id" | "title" | "author"; dir?: "asc" | "desc" } => {
    switch (key) {
      case "new":     return { sort: "id",     dir: "desc" }; // Новые сначала
      case "old":     return { sort: "id",     dir: "asc"  }; // Старые сначала
      case "az":      return { sort: "title",  dir: "asc"  }; // По названию A-Z
      case "za":      return { sort: "title",  dir: "desc" }; // По названию Z-A
      case "author":  return { sort: "author", dir: "asc"  }; // По автору A-Z
      default:        return {}; // Сортировка по умолчанию
    }
  };

  /**
   * ЭФФЕКТ ДЛЯ ЗАГРУЗКИ СПИСКА СТАТЕЙ
   * 
   * Выполняется при изменении параметров:
   * - start (смещение пагинации)
   * - limit (лимит на странице)
   * - search (поисковый запрос)
   * - sort (сортировка)
   * 
   * Преобразует параметры UI в формат API и загружает данные
   */
  useEffect(() => {
    const { sort: s, dir } = mapSort(sort);
    d(fetchList({ start, limit, q: search || undefined, sort: s, dir }));
  }, [d, start, limit, search, sort]);

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8">
      {/* ГЕРОИЧЕСКИЙ ХЕДЕР В СТИЛИСТИКЕ WARHAMMER 40K */}
      <section className="rounded-xl sm:rounded-2xl border-2 border-brass bg-gradient-to-br from-black via-gray-900 to-black p-6 sm:p-8 md:p-12 text-center gothic-border relative overflow-hidden shadow-2xl">
        {/* ДЕКОРАТИВНЫЕ ФОНОВЫЕ ЭЛЕМЕНТЫ */}
        <div className="absolute inset-0 opacity-20">
          {/* Анимированные черепа в углах для атмосферности */}
          <div className="absolute top-10 left-10 animate-pulse">
            <Skull className="w-32 h-32 text-brass" />
          </div>
          <div className="absolute bottom-10 right-10 animate-pulse" style={{ animationDelay: "1s" }}>
            <Skull className="w-32 h-32 text-mech" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">
            <Skull className="w-64 h-64 text-gray-800" />
          </div>
        </div>
        
        {/* ОСНОВНОЕ СОДЕРЖИМОЕ ХЕДЕРА */}
        <div className="relative z-10">
          {/* ЗАГОЛОВОК С ИКОНКАМИ */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <Shield className="w-10 h-10 sm:w-12 md:w-16 sm:h-12 md:h-16 text-brass animate-pulse drop-shadow-[0_0_15px_rgba(180,141,87,0.6)]" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-brass imperial-aquila tracking-wider drop-shadow-[0_0_20px_rgba(180,141,87,0.8)]">
              FANDOM WIKI
            </h1>
            <Book className="w-10 h-10 sm:w-12 md:w-16 sm:h-12 md:h-16 text-brass animate-pulse drop-shadow-[0_0_15px_rgba(180,141,87,0.6)]" />
          </div>
          
          {/* ПОДЗАГОЛОВОК С ГРАДИЕНТОМ */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-brass via-yellow-300 to-brass drop-shadow-[0_0_15px_rgbа(180,141,87,0.5)]">
            WARHAMMER 40,000
          </h2>
          
          {/* ОПИСАНИЕ ПРОЕКТА */}
          <p className="max-w-3xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed px-4 text-white/80 dark:text-white/80 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Фанатская энциклопедия персонажей, легионов и событий легендарной вселенной Warhammer 40k.
          </p>
          
          {/* КУЛЬТОВАЯ ЦИТАТА ИЗ ВСЕЛЕННОЙ */}
          <p className="text-mech font-bold text-base sm:text-lg md:text-xl mt-3 sm:mt-4 tracking-widest drop-shadow-[0_0_10px_rgba(193,18,31,0.6)]">
            «В мрачной тьме далекого будущего есть только война»
          </p>
        </div>
      </section>

      {/* ПАНЕЛЬ УПРАВЛЕНИЯ: ПОИСК И СОРТИРОВКА */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        {/* ПОИСКОВАЯ СТРОКА (ЗАНИМАЕТ ОСТАВШЕЕСЯ ПРОСТРАНСТВО) */}
        <div className="flex-1 flex gap-4">
          <SearchInput />
        </div>
        
        {/* ВЫПАДАЮЩИЙ СПИСОК СОРТИРОВКИ */}
        <SortControl />
      </div>

      {/* ОБРАБОТКА РАЗЛИЧНЫХ СОСТОЯНИЙ ПРИЛОЖЕНИЯ */}

      {/* СОСТОЯНИЕ ЗАГРУЗКИ */}
      {loading ? (
        <div className="text-center py-20">
          {/* АНИМИРОВАННЫЙ СПИННЕР В СТИЛИСТИКЕ WARHAMMER */}
          <div className="inline-block w-12 h-12 border-4 border-brass border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Загрузка статей…</p>
        </div>
      ) : 
      
      /* СОСТОЯНИЕ ОШИБКИ */
      error ? (
        <div className="text-center py-16">
          <p className="text-red-400 font-semibold">Ошибка: {error}</p>
          <p className="text-gray-400 mt-2">Обнови страницу или перезапусти API.</p>
        </div>
      ) : 
      
      /* СОСТОЯНИЕ ПУСТОГО СПИСКА */
      list.length === 0 ? (
        <div className="text-center py-16">
          {/* РАЗНЫЕ СООБЩЕНИЯ В ЗАВИСИМОСТИ ОТ НАЛИЧИЯ ПОИСКОВОГО ЗАПРОСА */}
          {search.trim() ? (
            <p className="text-gray-400">По запросу «{search}» ничего не найдено.</p>
          ) : (
            <>
              <p className="text-gray-400">Статей нет.</p>
              <p className="text-gray-500 text-sm mt-2">
                Проверь, что API запущен и файл <code>data/articles.json</code> содержит записи.
              </p>
            </>
          )}
        </div>
      ) : 
      
      /* УСПЕШНОЕ ОТОБРАЖЕНИЕ СТАТЕЙ */
      (
        <>
          {/* КОМПОНЕНТ СПИСКА СТАТЕЙ */}
          <ArticleList articles={list} />
          
          {/* ПАГИНАТОР (ПОКАЗЫВАЕТСЯ ЕСЛИ ЕСТЬ ЧТО ЛИСТАТЬ) */}
          {(total > limit || list.length >= limit) && <Paginator />}
        </>
      )}
    </div>
  );
}


// Комментарии объясняют:

// 1. Структуру главной страницы
// Героический хедер с тематическим дизайном
// Панель управления (поиск + сортировка)
// Основной контент (список статей)
// Пагинация внизу

// 2. Управление состоянием

// Загрузка данных при изменении параметров
// Обработка различных состояний (загрузка, ошибка, пустой список)
// Синхронизация UI параметров с API запросами

// 3. Дизайн в стиле Warhammer 40k

// Анимированные декоративные элементы (черепа, щиты, книги)
// Градиентные тексты и тени
// Цитаты из вселенной для атмосферности
// Адаптивный дизайн для всех устройств

// 4. Пользовательский опыт

// Визуальная обратная связь при загрузке
// Понятные сообщения об ошибках
// Интуитивная навигация и поиск
// Пагинация для больших списков


// 5. Архитектурные решения

// Разделение ответственности между компонентами
// Преобразование параметров UI → API
// Эффективная работа с Redux store
// Оптимизированные перерисовки

// Главная страница создает мощное первое впечатление
//  и предоставляет все необходимые инструменты для работы с
//  энциклопедией Warhammer 40,000!

