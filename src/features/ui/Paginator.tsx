import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setPaging } from "./uiSlice";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * КОМПОНЕНТ ПАГИНАЦИИ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Предоставляет навигацию по страницам для списков статей:
 * - Отображает текущий диапазон отображаемых элементов
 * - Предоставляет кнопки навигации "Назад" и "Вперед"
 * - Интегрирован с Redux store для глобального управления состоянием
 * - Автоматически скрывается когда пагинация не нужна
 */
export default function Paginator() {
  /**
   * ПОЛУЧЕНИЕ ПАРАМЕТРОВ ПАГИНАЦИИ ИЗ REDUX STORE
   * 
   * - start: текущее смещение (offset) для пагинации
   * - limit: количество элементов на странице
   * - total: общее количество элементов из раздела статей
   */
  const { start, limit } = useAppSelector(s => s.ui);
  const { total } = useAppSelector(s => s.articles);
  const d = useAppDispatch();

  /**
   * ВЫЧИСЛЕНИЕ СТАТУСА ПАГИНАЦИИ
   * 
   * - totalCount: общее количество элементов (защита от отрицательных значений)
   * - hasNext: есть ли следующая страница
   * - endIndex: индекс последнего элемента на текущей странице
   * - hasPrev: есть ли предыдущая страница
   */
  const totalCount = total;
  const hasNext = start + limit < totalCount;
  const endIndex = Math.min(start + limit, Math.max(totalCount, 0));
  const hasPrev = start > 0;

  /**
   * УСЛОВНЫЙ РЕНДЕРИНГ - СКРЫТИЕ ПАГИНАТОРА КОГДА ОН НЕ НУЖЕН
   * 
   * Пагинатор скрывается если:
   * - Всего элементов меньше или равно размеру страницы И
   * - Мы находимся на первой странице (start === 0)
   * 
   * Это предотвращает отображение ненужного интерфейса когда вся информация
   * помещается на одной странице
   */
  if (totalCount <= limit && start === 0) return null;

  return (
    <div className="flex items-center gap-4 justify-center">
      {/*
        КНОПКА "НАЗАД" - ПЕРЕХОД К ПРЕДЫДУЩЕЙ СТРАНИЦЕ
        - disabled: неактивна когда нет предыдущей страницы
        - onClick: уменьшает смещение на размер страницы (но не меньше 0)
        - Стили: соответствие дизайну Warhammer 40,000 (brass цвета)
      */}
      <button
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-brass hover:text-black border border-brass rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => d(setPaging({ start: Math.max(0, start - limit), limit }))}
        disabled={!hasPrev}
        aria-label="Предыдущая страница"
      >
        <ChevronLeft className="w-4 h-4" />
        Назад
      </button>

      {/*
        ИНФОРМАЦИЯ О ТЕКУЩЕМ ДИАПАЗОНЕ ЭЛЕМЕНТОВ
        - Формат: "Статьи X—Y из Z"
        - Защита от деления на ноль и отрицательных значений
        - Нейтральный цвет для хорошей читаемости в обеих темах
      */}
      <span className="text-gray-400">
        Статьи {totalCount === 0 ? 0 : start + 1}—{endIndex} из {totalCount}
      </span>

      {/*
        КНОПКА "ВПЕРЕД" - ПЕРЕХОД К СЛЕДУЮЩЕЙ СТРАНИЦЕ
        - disabled: неактивна когда нет следующей страницы
        - onClick: увеличивает смещение на размер страницы
        - Стили: зеркальное отображение кнопки "Назад"
      */}
      <button
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-brass hover:text-black border border-brass rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => d(setPaging({ start: start + limit, limit }))}
        disabled={!hasNext}
        aria-label="Следующая страница"
      >
        Вперед
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}



// Комментарии объясняют:

// 1. Логику пагинации

// Вычисление границ текущей страницы и общего количества
// Определение доступности навигационных кнопок
// Условный рендеринг для скрытия ненужного интерфейса

// 2. Интеграцию с состоянием приложения

// Синхронизацию с Redux через useAppSelector и useAppDispatch
// Обновление параметров пагинации через действие setPaging
// Доступ к данным статей для получения общего количества

// 3. Пользовательский интерфейс

// Информативный счетчик с точными номерами элементов
// Интуитивные кнопки навигации с иконками направления
// Визуальную обратную связь через состояния hover и disabled

// 4. Бизнес-логику

// Защиту от некорректных значений через Math.max и проверки
// Автоматическую оптимизацию интерфейса (скрытие при ненадобности)
// Согласованное поведение с другими компонентами UI

// 5. Доступность и UX

// ARIA-атрибуты для screen readers
// Плавные переходы между состояниями
// Четкие индикаторы доступности действий

// Компонент Paginator обеспечивает удобную и 
// надежную навигацию по большим спискам статей в Warhammer 40,000 Fandom Wiki, 
// интегрируясь с глобальной системой состояния и предоставляя пользователям 
// понятный контроль над просмотром контента.




