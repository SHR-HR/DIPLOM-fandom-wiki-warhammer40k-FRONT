import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchById } from "@/features/articles/articlesSlice";
import { putAddContent, putChangeInfo, putRedoContent } from "@/features/editor/editorSlice";
import AuthGate from "@/features/auth/AuthGate";
import { toast } from "react-hot-toast";
import type { ApiContentBlock } from "@/models/api";
import { Plus } from "lucide-react";

import ImageInput from "@/features/ui/ImageInput";
import ContentBlockEditor from "@/components/ContentBlockEditor";
import ContentPreview from "@/components/ContentPreview";

/**
 * СТРАНИЦА РЕДАКТИРОВАНИЯ СТАТЬИ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Позволяет авторам редактировать существующие статьи:
 * - Обновление основной информации (mainInfo)
 * - Добавление/изменение контент-блоков
 * - Предпросмотр изменений в реальном времени
 * - Три стратегии обновления контента: добавление, вставка, полная замена
 */

// Общий CSS класс для полей ввода (консистентность с NewArticlePage)
const field =
  "w-full px-4 py-2 rounded-lg transition outline-none " +
  "bg-white border border-gray-300 text-gray-900 placeholder-gray-400 " +
  "focus:ring-2 focus:ring-brass focus:border-brass " +
  "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400";

export default function EditPage() {
  // Получаем ID статьи из URL параметров
  const { id } = useParams();
  const d = useAppDispatch();
  const nav = useNavigate();

  // Статус авторизации и данные статьи из Redux store
  const isAuthed = useAppSelector((s) => s.auth.isAuthed);
  const art = useAppSelector((s) => s.articles.byId[Number(id)]);

  /**
   * СОСТОЯНИЯ ДЛЯ ОСНОВНОЙ ИНФОРМАЦИИ (MAININFO)
   * 
   * Отдельные состояния для каждого поля основной информации:
   * - name: имя персонажа/объекта
   * - image: URL изображения
   * - age: возраст (хранится как строка для удобства ввода)
   * - birthday: дата рождения/создания
   * - gender: пол/гендерная принадлежность
   * - appearance: описание внешности
   * - height: рост/высота
   * - weight: вес/масса
   */
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [age, setAge] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [appearance, setAppearance] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  /**
   * СОСТОЯНИЯ ДЛЯ РАБОТЫ С КОНТЕНТ-БЛОКАМИ
   * 
   * - blocks: временные блоки для редактирования
   * - position: позиция вставки новых блоков в существующий контент
   * - positionRef: ref для фокусировки на поле позиции при ошибках
   */
  const [blocks, setBlocks] = useState<ApiContentBlock[]>([]);
  const [position, setPosition] = useState<string>("");
  const positionRef = useRef<HTMLInputElement>(null);

  /**
   * ЭФФЕКТ ДЛЯ ЗАГРУЗКИ СТАТЬИ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
   * 
   * Загружает данные статьи по ID при монтировании компонента
   * или изменении ID в URL
   */
  useEffect(() => {
    if (id) d(fetchById(Number(id)));
  }, [id, d]);

  /**
   * ЭФФЕКТ ДЛЯ ЗАПОЛНЕНИЯ ФОРМЫ ДАННЫМИ ИЗ СТАТЬИ
   * 
   * Автоматически заполняет поля формы когда статья загружена
   * Срабатывает при изменении art или art.mainInfo
   */
  useEffect(() => {
    if (!art?.mainInfo) return;
    setName(art.mainInfo.name || "");
    setImage(art.mainInfo.image || "");
    setAge(String(art.mainInfo.age ?? ""));
    setBirthday(art.mainInfo.birthday || "");
    setGender(art.mainInfo.gender || "");
    setAppearance(art.mainInfo.appearance || "");
    setHeight(art.mainInfo.height || "");
    setWeight(art.mainInfo.weight || "");
  }, [art]);

  // ===== РАБОТА С КОНТЕНТ-БЛОКАМИ (АНАЛОГИЧНО NEWARTICLEPAGE) =====

  /**
   * ДОБАВЛЕНИЕ НОВОГО БЛОКА
   * 
   * @param type - тип блока (h1, h2, p, image, ul)
   * Создает новый блок с начальным содержимым в зависимости от типа
   */
  const addBlock = useCallback((type: string) => {
    setBlocks((prev) => [...prev, { type, content: type === "ul" ? [] : "" }]);
  }, []);

  /**
   * ОБНОВЛЕНИЕ СОДЕРЖИМОГО БЛОКА
   * 
   * @param index - индекс обновляемого блока
   * @param content - новое содержимое блока
   * Обновляет содержимое конкретного блока по индексу
   */
  const updateBlock = useCallback((index: number, content: any) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[index].content = content;
      return next;
    });
  }, []);

  /**
   * УДАЛЕНИЕ БЛОКА
   * 
   * @param index - индекс удаляемого блока
   * Удаляет блок из временного массива по индексу
   */
  const removeBlock = useCallback((index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * ФОРМИРОВАНИЕ МАССИВА БЛОКОВ ДЛЯ ПРЕДПРОСМОТРА
   * 
   * Объединяет существующие блоки статьи с новыми редактируемыми блоками
   * согласно указанной позиции вставки
   * 
   * Логика объединения:
   * 1. Берем существующие блоки из статьи (existingBlocks)
   * 2. Определяем позицию вставки (position)
   * 3. Вставляем новые блоки в указанную позицию
   * 4. Если позиция не указана - добавляем в конец
   */
  const existingBlocks: ApiContentBlock[] = (art?.mainContent as ApiContentBlock[]) ?? [];
  const mergedBlocks: ApiContentBlock[] = useMemo(() => {
    if (blocks.length === 0) return existingBlocks;
    const pos =
      Number.isFinite(Number(position)) && position !== ""
        ? Math.max(0, Number(position))
        : existingBlocks.length;
    const head = existingBlocks.slice(0, pos);
    const tail = existingBlocks.slice(pos);
    return [...head, ...blocks, ...tail];
  }, [existingBlocks, blocks, position]);

  // ===== API ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ ДАННЫХ =====

  /**
   * ОБНОВЛЕНИЕ ОСНОВНОЙ ИНФОРМАЦИИ СТАТЬИ
   * 
   * Отправляет обновленные данные mainInfo на сервер:
   * - Преобразует age в число (если указано)
   * - Использует undefined для пустых полей (удаление значений)
   * - Показывает уведомление о результате
   * - Перезагружает статью для синхронизации
   */
  const handleChangeInfo = async () => {
    try {
      await d(
        putChangeInfo({
          id: Number(id),
          info: {
            name: name || undefined,
            image: image || undefined,
            age: age ? Number(age) : undefined,
            birthday: birthday || undefined,
            gender: gender || undefined,
            appearance: appearance || undefined,
            height: height || undefined,
            weight: weight || undefined,
          },
        })
      ).unwrap();
      toast.success("Информация обновлена");
      d(fetchById(Number(id)));
    } catch {
      toast.error("Ошибка обновления");
    }
  };

  /**
   * ДОБАВЛЕНИЕ НОВЫХ БЛОКОВ КОНТЕНТА
   * 
   * Вставляет новые блоки в указанную позицию существующего контента:
   * - Проверяет что есть блоки для добавления
   * - Преобразует position в число (если указано)
   * - Показывает уведомление о результате
   * - Очищает временные состояния после успеха
   */
  const handleAddContent = async () => {
    if (blocks.length === 0) {
      toast.error("Добавьте блоки");
      positionRef.current?.focus();
      return;
    }
    try {
      await d(
        putAddContent({
          id: Number(id),
          blocks,
          position: position ? Number(position) : undefined,
        })
      ).unwrap();
      toast.success("Контент добавлен");
      setBlocks([]);
      setPosition("");
      d(fetchById(Number(id)));
    } catch {
      toast.error("Ошибка добавления");
    }
  };

  /**
   * ПОЛНАЯ ЗАМЕНА ВСЕГО КОНТЕНТА СТАТЬИ
   * 
   * Заменяет весь существующий контент на новые блоки:
   * - Запрашивает подтверждение действия (опасная операция)
   * - Используется когда нужно полностью переписать статью
   * - Очищает временные состояния после успеха
   */
  const handleRedoContent = async () => {
    if (blocks.length === 0) {
      toast.error("Добавьте блоки");
      return;
    }
    if (!confirm("Заменить весь контент?")) return;
    try {
      await d(putRedoContent({ id: Number(id), blocks })).unwrap();
      toast.success("Контент заменён");
      setBlocks([]);
      d(fetchById(Number(id)));
    } catch {
      toast.error("Ошибка замены");
    }
  };

  // ===== ПРОВЕРКИ ДОСТУПА И СОСТОЯНИЯ ЗАГРУЗКИ =====

  // Если пользователь не авторизован - показываем компонент авторизации
  if (!isAuthed) return <AuthGate />;

  // Если статья еще не загружена - показываем индикатор загрузки
  if (!art) return <div className="p-6 text-center">Загрузка…</div>;

  // ===== ОСНОВНОЙ РЕНДЕРИНГ СТРАНИЦЫ =====
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-brass mb-8">Редактировать: {art.title}</h1>

      {/* ДВУХКОЛОНОЧНЫЙ ЛАЙАУТ: ФОРМЫ И ПРЕДПРОСМОТР */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* ЛЕВАЯ КОЛОНКА - ФОРМЫ РЕДАКТИРОВАНИЯ */}
        <div className="space-y-6">
          {/* СЕКЦИЯ ОСНОВНОЙ ИНФОРМАЦИИ */}
          <section
            className="rounded-2xl border-2 border-brass p-6
            bg-white/95 text-gray-900 shadow-[0_12px_28px_rgba(0,0,0,.08)]
            dark:bg-gray-900 dark:text-gray-100"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-brass mb-4">
              Главная информация персонажа
            </h2>

            {/* СЕТКА ПОЛЕЙ ВВОДА */}
            <div className="grid md:grid-cols-2 gap-4">
              <input className={field} placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
              <div className="md:col-span-2">
                <ImageInput label="URL изображения персонажа" placeholder="https://…" value={image} onChange={setImage} />
              </div>
              <input className={field} placeholder="Возраст" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
              <input className={field} placeholder="День рождения" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
              <input className={field} placeholder="Пол" value={gender} onChange={(e) => setGender(e.target.value)} />
              <input className={field} placeholder="Внешность" value={appearance} onChange={(e) => setAppearance(e.target.value)} />
              <input className={field} placeholder="Рост" value={height} onChange={(e) => setHeight(e.target.value)} />
              <input className={field} placeholder="Вес" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>

            {/* КНОПКИ ДЕЙСТВИЙ ДЛЯ ОСНОВНОЙ ИНФОРМАЦИИ */}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="px-6 py-2 bg-brass hover:bg-yellow-600 text-black font-bold rounded-lg transition"
                onClick={handleChangeInfo}
              >
                Обновить информацию
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-lg transition
                  bg-gray-100 hover:bg-gray-200 text-gray-800
                  dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
                onClick={() => nav(`/article/${id}`)}
              >
                Назад к статье
              </button>
            </div>
          </section>

          {/* СЕКЦИЯ РЕДАКТИРОВАНИЯ КОНТЕНТА */}
          <section
            className="rounded-2xl border-2 border-brass p-6
            bg-white/95 text-gray-900 shadow-[0_12px_28px_rgba(0,0,0,.08)]
            dark:bg-gray-900 dark:text-gray-100"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-brass mb-4">Контент</h2>

            {/* ПАНЕЛЬ ИНСТРУМЕНТОВ ДЛЯ ДОБАВЛЕНИЯ БЛОКОВ */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                ["h1", "H1"],
                ["h2", "H2"],
                ["p", "Параграф"],
                ["image", "Изображение"],
                ["ul", "Список"],
              ].map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  className="px-3 py-2 rounded-lg transition flex items-center gap-2
                    bg-gray-100 text-gray-800 hover:bg-brass hover:text-black
                    dark:bg-gray-800 dark:text-gray-100"
                  onClick={() => addBlock(t)}
                >
                  <Plus className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* СПИСОК РЕДАКТИРУЕМЫХ БЛОКОВ */}
            <div className="space-y-4">
              {blocks.map((block, i) => (
                <ContentBlockEditor
                  key={i}
                  block={block}
                  index={i}
                  onUpdate={updateBlock}
                  onRemove={removeBlock}
                />
              ))}

              {/* СООБЩЕНИЕ ПРИ ОТСУТСТВИИ БЛОКОВ */}
              {blocks.length === 0 && (
                <div
                  className="text-center py-12 rounded-xl border-2 border-dashed
                    border-gray-300 text-gray-600
                    dark:border-gray-700 dark:text-gray-400"
                >
                  Добавьте блоки контента, используя кнопки выше
                </div>
              )}
            </div>

            {/* ПАНЕЛЬ УПРАВЛЕНИЯ КОНТЕНТОМ */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                ref={positionRef}
                className="w-40 px-4 py-2 rounded-lg transition outline-none
                  bg-white border border-gray-300 text-gray-900 placeholder-gray-400
                  focus:ring-2 focus:ring-brass focus:border-brass
                  dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="Позиция"
                type="number"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
              <button
                type="button"
                className="px-6 py-2 bg-brass hover:bg-yellow-600 text-black font-bold rounded-lg transition disabled:opacity-50"
                onClick={handleAddContent}
                disabled={blocks.length === 0}
              >
                Добавить блоки
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-mech hover:bg-red-700 text-white font-bold rounded-lg transition disabled:opacity-50"
                onClick={handleRedoContent}
                disabled={blocks.length === 0}
              >
                Заменить весь контент
              </button>
            </div>
          </section>
        </div>

        {/* ПРАВАЯ КОЛОНКА - ПРЕДПРОСМОТР ИЗМЕНЕНИЙ */}
        <div className="hidden lg:block">
          <ContentPreview
            title={art.title}
            previewImg={art.previewImg || ""}
            mainInfo={{
              name: name || undefined,
              image: image || undefined,
              age: age ? Number(age) : undefined,
              birthday: birthday || undefined,
              gender: gender || undefined,
              appearance: appearance || undefined,
              height: height || undefined,
              weight: weight || undefined,
            }}
            // Ключевой момент: передаем объединенные блоки для предпросмотра
            blocks={mergedBlocks}
          />

          {/* ИНФОРМАЦИЯ О ПОЗИЦИИ ВСТАВКИ */}
          {blocks.length > 0 && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              В предпросмотре показано: {blocks.length} блок(ов) будут вставлены на позицию{" "}
              {position === "" ? existingBlocks.length : Math.max(0, Number(position))}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}




// Комментарии объясняют:

// 1. Архитектуру страницы редактирования

// Двухколоночный layout (формы + предпросмотр)
// Разделение на основные секции (информация, контент)
// Синхронизация между состоянием и предпросмотром

// 2. Управление состоянием

// Отдельные состояния для каждого поля mainInfo
// Временные блоки для редактирования
// Позиция вставки новых блоков

// 3. Стратегии обновления контента

// Добавление блоков в указанную позицию
// Полная замена всего контента
// Обновление основной информации

// 4. Пользовательский опыт

// Валидация перед отправкой
// Подтверждение опасных операций
// Визуальная обратная связь через уведомления
// Реальный-time предпросмотр изменений

// 5. Интеграция с API

// Обработка успешных и неуспешных запросов
// Автоматическая перезагрузка данных после обновления
// Очистка временных состояний

// Страница предоставляет полный набор инструментов для редактирования статей
// с защитой от случайных изменений и понятным интерфейсом!





