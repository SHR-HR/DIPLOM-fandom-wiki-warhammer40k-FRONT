import { RETURN_TO_KEY } from "@/api/client";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { loadProfile, updateProfile, loadMyArticles } from "@/features/profile/profileSlice";
import { logout } from "@/features/auth/authSlice";
import { deleteArticle } from "@/api/endpoints";
import AuthGate from "@/features/auth/AuthGate";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { User, Edit2, Trash2, LogOut, Save, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { profileUpdateSchema } from "@/utils/validators";
import SmartImg from "@/components/SmartImg";

/**
 * СТРАНИЦА ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Предоставляет функциональность для управления профилем пользователя:
 * - Просмотр и редактирование профиля (имя, аватар)
 * - Управление созданными статьями (просмотр, редактирование, удаление)
 * - Навигация и система авторизации
 * - Обработка редиректов при истечении сессии
 */
export default function ProfilePage() {
  // Получаем данные авторизации и профиля из Redux store
  const isAuthed = useAppSelector((s) => s.auth.isAuthed);
  const mode = useAppSelector((s) => s.auth.mode); // Режим работы (local/production)
  const { profile, my } = useAppSelector((s) => s.profile); // Данные профиля и статей пользователя

  const d = useAppDispatch();
  const nav = useNavigate();
  const loc = useLocation();
  const [sp, setSp] = useSearchParams();

  /**
   * ОБРАБОТКА РЕДИРЕКТОВ ПРИ АВТОРИЗАЦИИ
   * 
   * Если пользователь был перенаправлен на страницу входа через RequireAuth,
   * в location.state будет сохранен исходный маршрут
   */
  const from = (loc.state as any)?.from?.pathname as string | undefined;

  /**
   * СОСТОЯНИЯ ДЛЯ РЕДАКТИРОВАНИЯ ПРОФИЛЯ
   */
  const [editing, setEditing] = useState(false);      // Режим редактирования профиля
  const [name, setName] = useState("");               // Имя пользователя
  const [ava, setAva] = useState("");                 // URL аватара
  const [errAva, setErrAva] = useState<string | null>(null); // Ошибка валидации аватара
  const [deletingId, setDeletingId] = useState<number | null>(null); // ID удаляемой статьи

  /**
   * ФОРМАТИРОВАНИЕ ДАТЫ РЕГИСТРАЦИИ ПОЛЬЗОВАТЕЛЯ
   * 
   * Поддерживает различные форматы дат с бэкенда:
   * - createdAt, created_at, created
   * useMemo для оптимизации - пересчитывается только при изменении profile
   */
  const createdLabel = useMemo(() => {
    if (!profile) return null;

    // Гибкий поиск поля с датой создания в ответе API
    const raw =
      (profile as any).createdAt ||
      (profile as any).created_at ||
      (profile as any).created ||
      null;

    if (!raw) return null;

    try {
      const dt = new Date(raw);
      if (Number.isNaN(dt.getTime())) return String(raw);
      // Форматирование даты в русской локали
      return dt.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return String(raw);
    }
  }, [profile]);

  /**
   * ОБРАБОТКА ПАРАМЕТРА URL ПРИ ИСТЕЧЕНИИ СЕАНСА
   * 
   * Показывает уведомление если пользователь был перенаправлен
   * из-за истекшей сессии (401/403 ошибки)
   */
  useEffect(() => {
    if (sp.get("expired") === "1") {
      toast("Сеанс истёк, войдите снова.", { icon: "🔒" });
      sp.delete("expired");
      setSp(sp, { replace: true }); // Очищаем параметр без перезагрузки страницы
    }
  }, [sp, setSp]);

  /**
   * ЗАГРУЗКА ДАННЫХ ПРОФИЛЯ И ОБРАБОТКА РЕДИРЕКТОВ
   * 
   * Выполняется при монтировании компонента и изменении статуса авторизации:
   * 1. Загружает данные профиля и статьи пользователя
   * 2. Обрабатывает редиректы после успешной авторизации
   * 3. В локальном режиме пропускает запросы к защищенным эндпоинтам
   */
  useEffect(() => {
    if (!isAuthed) return;

    // В локальном режиме не делаем запросы чтобы избежать 401 ошибок
    if (mode !== "local") {
      d(loadProfile());
      d(loadMyArticles());
    }

    // Приоритет 1: редирект от RequireAuth (из location.state)
    if (from) {
      nav(from, { replace: true });
      return;
    }

    // Приоритет 2: редирект от перехватчика 401/403 ошибок (из sessionStorage)
    const back = sessionStorage.getItem(RETURN_TO_KEY);
    if (back) {
      sessionStorage.removeItem(RETURN_TO_KEY);
      nav(back, { replace: true });
    }
  }, [isAuthed, mode, d, nav, from]);

  /**
   * ЗАПОЛНЕНИЕ ФОРМЫ РЕДАКТИРОВАНИЯ ДАННЫМИ ПРОФИЛЯ
   * 
   * Автоматически заполняет поля формы когда загружаются данные профиля
   */
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAva(profile.ava || "");
    }
  }, [profile]);

  /**
   * ВЫБОР АВАТАРА ДЛЯ ОТОБРАЖЕНИЯ
   * 
   * В режиме редактирования показываем значение из формы,
   * в обычном режиме - значение из профиля
   */
  const shownAva = useMemo(
    () => (editing ? ava : profile?.ava || ""),
    [editing, ava, profile?.ava]
  );

  /**
   * ОБНОВЛЕНИЕ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ
   * 
   * Выполняет валидацию и отправку обновленных данных на сервер:
   * 1. Валидация через Zod схему
   * 2. Отправка данных через Redux thunk
   * 3. Обработка успешного и неуспешного сценариев
   */
  const handleUpdate = async () => {
    try {
      setErrAva(null);
      // Валидация данных перед отправкой
      profileUpdateSchema.parse({ name, ava });
      await d(updateProfile({ name, ava })).unwrap();
      toast.success("Профиль обновлён");
      setEditing(false);
    } catch (err: any) {
      // Универсальная обработка ошибок (Zod и сетевые ошибки)
      const msg =
        err?.errors?.[0]?.message ||
        err?.message ||
        "Ошибка обновления";
      setErrAva(String(msg));
      toast.error(String(msg));
    }
  };

  /**
   * УДАЛЕНИЕ СТАТЬИ ПОЛЬЗОВАТЕЛЯ
   * 
   * @param id - ID удаляемой статьи
   * Выполняет подтверждение и отправку запроса на удаление
   */
  const handleDelete = async (id: number) => {
    if (!confirm("Удалить статью?")) return;
    try {
      setDeletingId(id);
      await deleteArticle(id);
      toast.success("Статья удалена");
      d(loadMyArticles()); // Перезагружаем список статей
    } catch {
      toast.error("Ошибка удаления");
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * ВЫХОД ИЗ СИСТЕМЫ
   * 
   * Выполняет logout и перенаправляет на главную страницу
   */
  const handleLogout = async () => {
    await d(logout());
    toast.success("Вы вышли из системы");
    nav("/", { replace: true });
  };

  // Если пользователь не авторизован - показываем компонент авторизации
  if (!isAuthed) return <AuthGate />;

  /**
   * ОСНОВНОЙ РЕНДЕРИНГ СТРАНИЦЫ ПРОФИЛЯ
   */
  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8 min-h-[calc(100vh-16rem)]">
      {/* СЕКЦИЯ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ */}
      <section className="max-w-2xl mx-auto rounded-xl sm:rounded-2xl border-2 border-brass bg-gray-900 p-4 sm:p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          <User className="w-8 h-8 text-brass" />
          <h1 className="text-3xl font-bold text-brass">Профиль</h1>
        </div>

        {profile && (
          <div className="space-y-6">
            {/* ОСНОВНАЯ ИНФОРМАЦИЯ ПРОФИЛЯ */}
            <div className="flex items-center gap-6">
              {/* КОМПОНЕНТ АВАТАРА С ОБРАБОТКОЙ ОШИБОК */}
              <SmartImg
                key={shownAva} // key для принудительного пересоздания при изменении аватара
                original={shownAva}
                alt={profile.name}
                variant="content"
                fit="cover"
                framed
                radiusClass="rounded-full"
                className="w-full h-full object-cover"
                lazy
                outerClassName="w-32 h-32 sm:w-40 sm:h-40 border-2 border-brass my-0"
              />

              <div className="flex-1">
                {editing ? (
                  /* РЕЖИМ РЕДАКТИРОВАНИЯ */
                  <div className="space-y-3">
                    <input
                      className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-brass outline-none"
                      placeholder="Имя"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <div>
                      <input
                        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-brass outline-none"
                        placeholder="URL аватара"
                        value={ava}
                        onChange={(e) => setAva(e.target.value)}
                      />
                      {errAva && <p className="text-sm text-mech mt-1">{errAva}</p>}
                    </div>
                  </div>
                ) : (
                  /* РЕЖИМ ПРОСМОТРА */
                  <>
                    <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>

                    {/* МЕТА-ИНФОРМАЦИЯ ПРОФИЛЯ */}
                    {(createdLabel || my.length > 0) && (
                      <p className="text-xs text-gray-400 mb-2">
                        {createdLabel && <>На сайте с {createdLabel}</>}
                        {createdLabel && my.length > 0 && " · "}
                        {my.length > 0 && <>Статей: {my.length}</>}
                      </p>
                    )}

                    {/* URL АВАТАРА (ТОЛЬКО ЕСЛИ ЕСТЬ) */}
                    {profile.ava && (
                      <p className="text-gray-500 text-xs break-all">
                        {profile.ava}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ПАНЕЛЬ ДЕЙСТВИЙ ПРОФИЛЯ */}
            <div className="flex flex-wrap gap-3">
              {editing ? (
                /* КНОПКИ В РЕЖИМЕ РЕДАКТИРОВАНИЯ */
                <>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-brass hover:bg-yellow-600 text-black font-bold rounded-lg transition"
                    onClick={handleUpdate}
                  >
                    <Save className="w-4 h-4" />
                    Сохранить
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                    onClick={() => setEditing(false)}
                  >
                    Отмена
                  </button>
                </>
              ) : (
                /* КНОПКА РЕДАКТИРОВАНИЯ В ОБЫЧНОМ РЕЖИМЕ */
                <button
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-brass hover:text-black border border-brass rounded-lg transition"
                  onClick={() => setEditing(true)}
                >
                  <Edit2 className="w-4 h-4" />
                  Редактировать
                </button>
              )}

              {/* КНОПКА СОЗДАНИЯ НОВОЙ СТАТЬИ */}
              <Link
                to="/new"
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-brass bg-gray-900 hover:bg-brass hover:text-black transition"
              >
                <Plus className="w-4 h-4" />
                Новая статья
              </Link>

              {/* КНОПКА ВЫХОДА ИЗ СИСТЕМЫ */}
              <button
                className="flex items-center gap-2 px-4 py-2 bg-mech hover:bg-red-700 text-white rounded-lg transition"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </div>
        )}
      </section>

      {/* СЕКЦИЯ СТАТЕЙ ПОЛЬЗОВАТЕЛЯ */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-brass mb-4">Мои статьи</h2>
        
        {/* СОСТОЯНИЕ ПУСТОГО СПИСКА СТАТЕЙ */}
        {my.length === 0 ? (
          <p className="text-center text-gray-400 py-10">У вас пока нет статей</p>
        ) : (
          /* СПИСОК СТАТЕЙ ПОЛЬЗОВАТЕЛЯ */
          <div className="space-y-4">
            {my.map((article) => {
              /**
               * ОПРЕДЕЛЕНИЕ СТАТУСА СТАТЬИ (ЧЕРНОВИК/ОПУБЛИКОВАНО)
               * 
               * Поддерживает различные форматы полей статуса с бэкенда:
               * - isDraft, draft, status === "draft"
               */
              const isDraft =
                (article as any).isDraft ??
                (article as any).draft ??
                (article as any).status === "draft";

              const badgeText = isDraft ? "Черновик" : "Опубликовано";

              // Классы для бейджа в зависимости от статуса
              const badgeClass =
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border shadow-sm " +
                (isDraft
                  ? "border-gray-500/80 bg-gray-900/80 text-gray-200" // Стиль для черновика
                  : "border-brass/80 bg-brass text-black"); // Стиль для опубликованной статьи

              return (
                <div
                  key={article.id}
                  className="group flex items-center gap-4 p-4 rounded-2xl border border-brass bg-gray-900/95 hover:bg-gray-900 hover:-translate-y-[2px] hover:shadow-[0_0_26px_rgba(180,141,87,0.55)] transition-all duration-200"
                >
                  {/* ПРЕВЬЮ СТАТЬИ */}
                  <SmartImg
                    key={article.previewImg}
                    original={article.previewImg}
                    alt={article.title}
                    variant="content"
                    fit="cover"
                    framed
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                    lazy
                    outerClassName="w-32 h-24 sm:w-40 sm:h-28 rounded-xl my-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {/* ЗАГОЛОВОК СТАТЬИ С ССЫЛКОЙ */}
                      <Link
                        to={`/article/${article.id}`}
                        className="text-lg font-bold text-brass hover:text-yellow-400 line-clamp-2"
                        title={article.title}
                      >
                        {article.title}
                      </Link>

                      {/* БЕЙДЖ СТАТУСА СТАТЬИ */}
                      <span className={badgeClass}>{badgeText}</span>
                    </div>
                  </div>

                  {/* КНОПКИ УПРАВЛЕНИЯ СТАТЬЕЙ */}
                  <div className="ml-auto flex items-center gap-2">
                    {/* КНОПКА РЕДАКТИРОВАНИЯ */}
                    <Link
                      to={`/edit/${article.id}`}
                      title="Редактировать"
                      className="icon-btn"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    
                    {/* КНОПКА УДАЛЕНИЯ С ИНДИКАТОРОМ ЗАГРУЗКИ */}
                    <button
                      onClick={() => handleDelete(article.id)}
                      title="Удалить"
                      className="icon-btn icon-btn--danger disabled:opacity-50"
                      disabled={deletingId === article.id}
                    >
                      {deletingId === article.id ? (
                        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}




// Комментарии объясняют:

// 1. Архитектуру страницы профиля

// Разделение на секции (профиль, статьи)
// Управление состоянием редактирования
// Обработка различных режимов работы (local/production)

// 2. Систему авторизации и редиректов

// Обработка редиректов после входа
// Сохранение исходного маршрута
// Управление сессией и истечением токенов

// 3. Управление профилем пользователя

// Редактирование имени и аватара
// Валидация данных через Zod схемы
// Визуальная обратная связь при ошибках

// 4. Управление статьями пользователя

// Отображение списка созданных статей
// Определение статуса статей (черновик/опубликовано)
// Функциональность удаления с подтверждением
// Индикаторы загрузки при операциях

// 5. Пользовательский опыт

// Адаптивный дизайн для всех устройств
// Плавные анимации и переходы
// Понятные сообщения об ошибках
// Подтверждение опасных операций

// Страница профиля предоставляет полный набор 
// инструментов для управления учетной записью и 
// контентом пользователя в тематике Warhammer 40,000!





