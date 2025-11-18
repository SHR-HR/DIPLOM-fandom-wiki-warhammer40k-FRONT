import { useId, useState, useRef, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { createNew } from "@/features/editor/editorSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { articleSchema } from "@/utils/validators";
import AuthGate from "@/features/auth/AuthGate";
import ImageInput from "@/features/ui/ImageInput";
import ContentBlockEditor from "@/components/ContentBlockEditor";
import ContentPreview from "@/components/ContentPreview";
import { Plus, AlertCircle } from "lucide-react";
import type { ApiContentBlock } from "@/models/api";

/**
 * СТРАНИЦА СОЗДАНИЯ НОВОЙ СТАТЬИ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Позволяет авторизованным пользователям создавать новые статьи:
 * - Ввод основной информации и мета-данных
 * - Добавление контент-блоков различного типа
 * - Валидация данных перед отправкой
 * - Предпросмотр статьи в реальном времени
 */

// Общий CSS класс для всех полей ввода (консистентность между светлой и темной темами)
const field =
  "w-full px-4 py-2 rounded-lg transition outline-none " +
  "bg-white border border-gray-300 text-gray-900 placeholder-gray-400 " +
  "focus:ring-2 focus:ring-brass focus:border-brass " +
  "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400";

export default function NewArticlePage() {
  // Проверка авторизации пользователя
  const isAuthed = useAppSelector((s) => s.auth.isAuthed);
  const d = useAppDispatch();
  const nav = useNavigate();

  /**
   * СОСТОЯНИЯ ДЛЯ ОСНОВНЫХ ПОЛЕЙ СТАТЬИ
   */
  const [title, setTitle] = useState("");           // Заголовок статьи (обязательный)
  const [previewImg, setPreviewImg] = useState(""); // URL превью-изображения (обязательный)
  
  /**
   * СОСТОЯНИЯ ДЛЯ ОСНОВНОЙ ИНФОРМАЦИИ ПЕРСОНАЖА (MAININFO)
   * Все поля опциональны согласно схеме валидации
   */
  const [name, setName] = useState("");             // Имя персонажа
  const [image, setImage] = useState("");           // URL изображения персонажа
  const [age, setAge] = useState("");               // Возраст (хранится как строка)
  const [birthday, setBirthday] = useState("");     // Дата рождения
  const [gender, setGender] = useState("");         // Пол
  const [appearance, setAppearance] = useState(""); // Внешность
  const [height, setHeight] = useState("");         // Рост
  const [weight, setWeight] = useState("");         // Вес

  /**
   * СОСТОЯНИЯ ДЛЯ УПРАВЛЕНИЯ КОНТЕНТОМ И ФОРМОЙ
   */
  const [blocks, setBlocks] = useState<ApiContentBlock[]>([]);  // Массив контент-блоков
  const [loading, setLoading] = useState(false);                // Флаг отправки формы
  const [errors, setErrors] = useState<string[]>([]);           // Ошибки валидации

  /**
   * ГЕНЕРАЦИЯ УНИКАЛЬНЫХ ID ДЛЯ СВЯЗКИ LABEL↔INPUT
   * useId гарантирует уникальность ID на протяжении всего жизненного цикла компонента
   */
  const titleId = useId();
  const nameId = useId();
  const ageId = useId();
  const birthdayId = useId();
  const genderId = useId();
  const appearanceId = useId();
  const heightId = useId();
  const weightId = useId();

  // Ref для фокусировки на поле заголовка при ошибках валидации
  const titleRef = useRef<HTMLInputElement>(null);

  /**
   * ФУНКЦИИ ДЛЯ РАБОТЫ С КОНТЕНТ-БЛОКАМИ
   * Используем useCallback для оптимизации перерисовок дочерних компонентов
   */

  // Добавление нового блока контента
  const addBlock = useCallback((type: string) => {
    setBlocks((prev) => [...prev, { 
      type, 
      content: type === "ul" ? [] : "" // Для списков - массив, для остальных - строка
    }]);
  }, []);

  // Обновление содержимого блока по индексу
  const updateBlock = useCallback((index: number, content: any) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[index].content = content;
      return next;
    });
    setErrors([]); // Очищаем ошибки при изменении контента
  }, []);

  // Удаление блока по индексу
  const removeBlock = useCallback((index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * ПРОВЕРКА ВАЛИДНОСТИ ФОРМЫ
   * 
   * Условия валидности (по ТЗ):
   * 1. Заголовок не пустой
   * 2. Превью-изображение не пустое
   * 3. Есть хотя бы один блок контента
   * 4. Все данные проходят Zod валидацию
   * 
   * useMemo для оптимизации - пересчитывается только при изменении зависимостей
   */
  const isValid = useMemo(() => {
    // Базовые проверки обязательных полей
    if (!title.trim() || !previewImg.trim() || blocks.length === 0) return false;
    
    try {
      // Детальная валидация через Zod схему
      articleSchema.parse({
        title,
        previewImg,
        mainInfo: {
          name: name || undefined,
          image: image || undefined,
          age: age ? Number(age) : undefined,
          birthday: birthday || undefined,
          gender: gender || undefined,
          appearance: appearance || undefined,
          height: height || undefined,
          weight: weight || undefined,
        },
      });
      return true;
    } catch {
      return false;
    }
  }, [title, previewImg, name, image, age, birthday, gender, appearance, height, weight, blocks]);

  /**
   * ОБРАБОТЧИК ОТПРАВКИ ФОРМЫ
   * 
   * Выполняет:
   * 1. Предварительную валидацию
   * 2. Zod валидацию данных
   * 3. Отправку на сервер
   * 4. Навигацию на страницу созданной статьи
   * 5. Обработку ошибок
   */
  const handleSubmit = async () => {
    // Предварительная валидация обязательных полей
    if (!isValid) {
      const errs: string[] = [];
      if (!title.trim()) errs.push("Заголовок обязателен");
      if (!previewImg.trim()) errs.push("Превью изображение обязательно");
      if (blocks.length === 0) errs.push("Добавьте хотя бы один блок контента");
      setErrors(errs);
      titleRef.current?.focus(); // Фокус на первое проблемное поле
      toast.error("Заполните все обязательные поля");
      return;
    }

    try {
      // Детальная валидация через Zod
      const data = articleSchema.parse({
        title,
        previewImg,
        mainInfo: {
          name: name || undefined,
          image: image || undefined,
          age: age ? Number(age) : undefined,
          birthday: birthday || undefined,
          gender: gender || undefined,
          appearance: appearance || undefined,
          height: height || undefined,
          weight: weight || undefined,
        },
      });

      // Отправка данных на сервер
      setLoading(true);
      const result = await d(createNew({ 
        ...data, 
        mainContent: blocks // Добавляем контент-блоки к данным
      })).unwrap();
      
      toast.success("Статья успешно создана!");
      nav(`/article/${result.id}`); // Переход на страницу созданной статьи
    } catch (err: any) {
      // Обработка ошибок валидации или сетевых ошибок
      toast.error(err?.errors?.[0]?.message || "Ошибка создания статьи");
    } finally {
      setLoading(false);
    }
  };

  // Если пользователь не авторизован - показываем компонент авторизации
  if (!isAuthed) return <AuthGate />;

  /**
   * ОСНОВНОЙ РЕНДЕРИНГ СТРАНИЦЫ
   */
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-brass mb-8">Создать статью</h1>

      {/* БЛОК ОШИБОК ВАЛИДАЦИИ */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border-2 border-mech bg-mech/10 dark:bg-mech/20">
          <div className="flex items-center gap-2 text-mech font-bold mb-2">
            <AlertCircle className="w-5 h-5" />
            <span>Ошибки валидации:</span>
          </div>
          <ul className="list-disc list-inside text-red-600 dark:text-red-300 text-sm space-y-1">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ДВУХКОЛОНОЧНЫЙ ЛАЙАУТ: ФОРМЫ И ПРЕДПРОСМОТР */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* ЛЕВАЯ КОЛОНКА - ФОРМЫ ВВОДА */}
        <div className="space-y-6">
          {/* СЕКЦИЯ ОСНОВНОЙ ИНФОРМАЦИИ */}
          <section
            className="rounded-2xl border-2 border-brass p-6
            bg-white/95 text-gray-900 shadow-[0_12px_28px_rgba(0,0,0,.08)]
            dark:bg-gray-900 dark:text-gray-100"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-brass mb-4">
              Основная информация
            </h2>
            <div className="space-y-4">
              {/* ПОЛЕ ЗАГОЛОВКА */}
              <div>
                <label
                  htmlFor={titleId}
                  className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                >
                  Заголовок *
                </label>
                <input
                  id={titleId}
                  ref={titleRef}
                  name="title"
                  className={field}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Введите заголовок статьи"
                />
              </div>

              {/* КОМПОНЕНТ ВВОДА ИЗОБРАЖЕНИЯ */}
              <ImageInput
                label="Превью изображение *"
                placeholder="https://example.com/image.webp"
                value={previewImg}
                onChange={setPreviewImg}
              />
            </div>
          </section>

          {/* СЕКЦИЯ ИНФОРМАЦИИ ПЕРСОНАЖА */}
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
              {/* ИМЯ ПЕРСОНАЖА */}
              <div className="md:col-span-2">
                <label htmlFor={nameId} className="sr-only">Имя</label>
                <input
                  id={nameId}
                  name="name"
                  className={field}
                  placeholder="Имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* ИЗОБРАЖЕНИЕ ПЕРСОНАЖА */}
              <div className="md:col-span-2">
                <ImageInput
                  placeholder="URL изображения персонажа"
                  value={image}
                  onChange={setImage}
                />
              </div>

              {/* ВОЗРАСТ */}
              <div>
                <label htmlFor={ageId} className="sr-only">Возраст</label>
                <input
                  id={ageId}
                  name="age"
                  className={field}
                  placeholder="Возраст"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>

              {/* ДЕНЬ РОЖДЕНИЯ */}
              <div>
                <label htmlFor={birthdayId} className="sr-only">День рождения</label>
                <input
                  id={birthdayId}
                  name="birthday"
                  className={field}
                  placeholder="День рождения"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </div>

              {/* ПОЛ */}
              <div>
                <label htmlFor={genderId} className="sr-only">Пол</label>
                <input
                  id={genderId}
                  name="gender"
                  className={field}
                  placeholder="Пол"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                />
              </div>

              {/* ВНЕШНОСТЬ */}
              <div>
                <label htmlFor={appearanceId} className="sr-only">Внешность</label>
                <input
                  id={appearanceId}
                  name="appearance"
                  className={field}
                  placeholder="Внешность"
                  value={appearance}
                  onChange={(e) => setAppearance(e.target.value)}
                />
              </div>

              {/* РОСТ */}
              <div>
                <label htmlFor={heightId} className="sr-only">Рост</label>
                <input
                  id={heightId}
                  name="height"
                  className={field}
                  placeholder="Рост"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>

              {/* ВЕС */}
              <div>
                <label htmlFor={weightId} className="sr-only">Вес</label>
                <input
                  id={weightId}
                  name="weight"
                  className={field}
                  placeholder="Вес"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
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
          </section>

          {/* ПАНЕЛЬ КНОПОК УПРАВЛЕНИЯ */}
          <div className="flex gap-4">
            <button
              type="button"
              className="flex-1 py-3 px-6 bg-brass hover:bg-yellow-600 text-black font-bold rounded-lg transition disabled:opacity-50 relative z-10"
              onClick={handleSubmit}
              disabled={loading || !isValid}
            >
              {loading ? "Создание..." : "Создать статью"}
            </button>
            <button
              type="button"
              className="px-6 py-3 rounded-lg transition
                bg-gray-100 hover:bg-gray-200 text-gray-800
                dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
              onClick={() => nav("/")}
            >
              Отмена
            </button>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА - ПРЕДПРОСМОТР СТАТЬИ */}
        <div className="hidden lg:block">
          <ContentPreview
            title={title}
            previewImg={previewImg}
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
            blocks={blocks}
          />
        </div>
      </div>
    </div>
  );
}




// Комментарии объясняют:

// 1. Архитектуру страницы создания статьи

// Двухколоночный layout (формы + предпросмотр)
// Разделение на логические секции
// Синхронизация состояния с предпросмотром

// 2. Управление состоянием

// Отдельные состояния для каждого поля
// Оптимизированные функции работы с блоками
// Валидация данных в реальном времени

// 3. Систему валидации

// Предварительная проверка обязательных полей
// Детальная Zod валидация
// Визуальная обратная связь об ошибках

// 4. Пользовательский опыт

// Подсказки для обязательных полей
// Предпросмотр в реальном времени
// Защита от случайных действий
// Понятные сообщения об ошибках

// 5. Интеграцию с API

// Отправка данных через Redux thunk
// Обработка успешных и неуспешных сценариев
// Навигация на созданную статью

// Страница предоставляет удобный интерфейс для 
// создания полноценных статей с богатым контентом 
// в тематике Warhammer 40,000!

