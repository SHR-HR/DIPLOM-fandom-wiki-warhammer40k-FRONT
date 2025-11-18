import { useState, type FormEvent, useId } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { UserPlus, Mail, Lock, User as UserIcon, Eye, EyeOff, Shield } from "lucide-react";
import { z } from "zod";
import { registerUserApi } from "@/api/endpoints";
import { useAppDispatch } from "@/app/hooks";
import { login } from "@/features/auth/authSlice";
import { consumeReturnTo } from "@/api/client"; // <— важно: корректный возврат после успешного логина

/**
 * СХЕМА ВАЛИДАЦИИ ФОРМЫ РЕГИСТРАЦИИ
 * 
 * Использует Zod для строгой типизации и валидации данных:
 * - name: Имя пользователя (2-50 символов)
 * - login: Логин (3-20 символов, только латиница/цифры/_)
 * - email: Опциональный email с валидацией формата
 * - password: Пароль (мин. 3 символа, обязаны быть буквы и цифры)
 * - confirmPassword: Подтверждение пароля с проверкой совпадения
 */
const registerSchema = z
  .object({
    name: z.string().min(2, "Имя должно содержать минимум 2 символа").max(50, "Имя должно содержать максимум 50 символов"),
    login: z
      .string()
      .min(3, "Логин должен содержать минимум 3 символа")
      .max(20, "Логин должен содержать максимум 20 символов")
      .regex(/^[a-zA-Z0-9_]+$/, "Логин может содержать только латинские буквы, цифры и _"),
    email: z.string().email("Некорректный email").optional().or(z.literal("").transform(() => undefined)),
    password: z
      .string()
      .min(3, "Пароль должен содержать минимум 3 символа")
      .regex(/[A-Za-z]/, "Пароль должен содержать латинские буквы")
      .regex(/[0-9]/, "Пароль должен содержать цифры"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"], // Указывает какое поле будет отмечено ошибкой
  });

/**
 * СТРАНИЦА РЕГИСТРАЦИИ WARHAMMER 40,000 FANDOM WIKI
 * 
 * Предоставляет функциональность создания нового аккаунта:
 * - Валидация вводимых данных на клиенте и сервере
 * - Автоматический вход после успешной регистрации
 * - Обработка редиректов на предыдущую страницу
 * - Визуальная обратная связь и доступность
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const d = useAppDispatch();

  /**
   * ID ДЛЯ ДОСТУПНОСТИ (ACCESSIBILITY)
   * 
   * Создает уникальные идентификаторы для связки label↔input
   * Улучшает опыт для пользователей с screen readers
   */
  const nameId = useId();
  const loginId = useId();
  const emailId = useId();
  const passId = useId();
  const pass2Id = useId();

  // СОСТОЯНИЯ КОМПОНЕНТА
  const [loading, setLoading] = useState(false); // Индикатор загрузки при отправке формы
  const [showPassword, setShowPassword] = useState(false); // Видимость основного пароля
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Видимость подтверждения пароля
  
  /**
   * ДАННЫЕ ФОРМЫ РЕГИСТРАЦИИ
   * 
   * Содержит все поля формы в одном объекте для удобства управления
   */
  const [formData, setFormData] = useState({
    name: "",
    login: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  /**
   * ОШИБКИ ВАЛИДАЦИИ
   * 
   * Хранит ошибки для каждого поля формы
   * Обновляется при клиентской и серверной валидации
   */
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * ОБРАБОТЧИК ИЗМЕНЕНИЯ ПОЛЕЙ ФОРМЫ
   * 
   * @param e - Событие изменения input элемента
   * Обновляет данные формы и очищает ошибку для изменяемого поля
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Очищаем ошибку при начале редактирования поля
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /**
   * ОБРАБОТЧИК ОТПРАВКИ ФОРМЫ РЕГИСТРАЦИИ
   * 
   * Выполняет полный цикл регистрации:
   * 1. Клиентская валидация через Zod
   * 2. Отправка данных на сервер
   * 3. Автоматический вход после успешной регистрации
   * 4. Обработка редиректов и ошибок
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({}); // Сбрасываем предыдущие ошибки

    /**
     * КЛИЕНТСКАЯ ВАЛИДАЦИЯ С ZOD
     * 
     * safeParse возвращает объект с результатом валидации
     * без выбрасывания исключения
     */
    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      // Преобразуем ошибки Zod в формат для отображения в UI
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string | undefined;
        if (field) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      /**
       * ЭТАП 1: РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ НА СЕРВЕРЕ
       * 
       * Отправляем данные на API для создания нового аккаунта
       * email передается как undefined если поле пустое
       */
      await registerUserApi({
        name: formData.name,
        login: formData.login,
        password: formData.password,
        email: formData.email || undefined,
      });

      /**
       * ЭТАП 2: АВТОМАТИЧЕСКИЙ ВХОД ПОСЛЕ РЕГИСТРАЦИИ
       * 
       * Используем те же credentials для автоматической аутентификации
       * remember: true - сохраняет сессию между перезагрузками
       */
      await d(login({ username: formData.login, password: formData.password, remember: true })).unwrap();

      /**
       * ЭТАП 3: УСПЕШНАЯ РЕГИСТРАЦИЯ И РЕДИРЕКТ
       * 
       * - Показываем приветственное сообщение
       * - Восстанавливаем исходный маршрут из sessionStorage
       * - Выполняем редирект с заменой истории
       */
      toast.success(`Добро пожаловать, ${formData.name}!`);
      const back = consumeReturnTo(); // Получаем сохраненный маршрут
      navigate(back || "/profile", { replace: true });
      
    } catch (err: any) {
      /**
       * ОБРАБОТКА ОШИБОК РЕГИСТРАЦИИ
       * 
       * Извлекаем сообщение об ошибке из ответа сервера
       * Пытаемся определить к какому полю относится ошибка
       */
      const raw = String(err?.response?.data?.detail || err?.message || "Ошибка регистрации");
      toast.error(raw);

      /**
       * УМНАЯ ПРИВЯЗКА ОШИБОК К ПОЛЯМ ФОРМЫ
       * 
       * Анализируем текст ошибки для определения проблемного поля
       * Регистронезависимый поиск по ключевым словам
       */
      const lower = raw.toLowerCase();
      if (lower.includes("логин") || lower.includes("login")) setErrors((p) => ({ ...p, login: raw }));
      if (lower.includes("email") || lower.includes("почт")) setErrors((p) => ({ ...p, email: raw }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * РЕНДЕРИНГ СТРАНИЦЫ РЕГИСТРАЦИИ
   * 
   * Адаптивный дизайн с тематикой Warhammer 40,000
   * Соответствует общему стилю Fandom Wiki
   */
  return (
    <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center px-3 sm:px-4 py-8">
      <div className="w-full max-w-md">
        {/* КАРТОЧКА ФОРМЫ РЕГИСТРАЦИИ */}
        <div className="rounded-xl sm:rounded-2xl border-2 border-brass bg-gray-900 p-6 sm:p-8 shadow-[0_0_30px_rgba(180,141,87,0.3)]">
          
          {/* ЗАГОЛОВОК С ИКОНКОЙ */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brass/10 border-2 border-brass mb-4">
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-brass" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brass mb-2">Регистрация</h1>
            <p className="text-gray-400 text-sm sm:text-base">Присоединяйтесь к Империуму Человечества</p>
          </div>

          {/* ФОРМА РЕГИСТРАЦИИ */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
            
            {/* ПОЛЕ ИМЕНИ ПОЛЬЗОВАТЕЛЯ */}
            <div>
              <label htmlFor={nameId} className="block text-gray-300 text-sm font-medium mb-2">
                <UserIcon className="w-4 h-4 inline mr-2" />
                Имя
              </label>
              <input
                id={nameId}
                type="text"
                name="name"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                aria-invalid={!!errors.name}
                className={`w-full px-4 py-3 rounded-lg bg-gray-800 border ${
                  errors.name ? "border-mech" : "border-gray-700"
                } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brass transition`}
                placeholder="Ваше имя"
                required
              />
              {errors.name && <p className="mt-1 text-xs text-mech">{errors.name}</p>}
            </div>

            {/* ПОЛЕ ЛОГИНА */}
            <div>
              <label htmlFor={loginId} className="block text-gray-300 text-sm font-medium mb-2">
                <UserIcon className="w-4 h-4 inline mr-2" />
                Логин
              </label>
              <input
                id={loginId}
                type="text"
                name="login"
                autoComplete="username"
                value={formData.login}
                onChange={handleChange}
                aria-invalid={!!errors.login}
                className={`w-full px-4 py-3 rounded-lg bg-gray-800 border ${
                  errors.login ? "border-mech" : "border-gray-700"
                } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brass transition`}
                placeholder="Логин для входа (латиница, цифры, _)"
                required
              />
              {errors.login && <p className="mt-1 text-xs text-mech">{errors.login}</p>}
            </div>

            {/* ПОЛЕ EMAIL (ОПЦИОНАЛЬНОЕ) */}
            <div>
              <label htmlFor={emailId} className="block text-gray-300 text-sm font-medium mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email (необязателен)
              </label>
              <input
                id={emailId}
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={!!errors.email}
                className={`w-full px-4 py-3 rounded-lg bg-gray-800 border ${
                  errors.email ? "border-mech" : "border-gray-700"
                } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brass transition`}
                placeholder="your@email.com"
              />
              {errors.email && <p className="mt-1 text-xs text-mech">{errors.email}</p>}
            </div>

            {/* ПОЛЕ ПАРОЛЯ С ПЕРЕКЛЮЧАТЕЛЕМ ВИДИМОСТИ */}
            <div>
              <label htmlFor={passId} className="block text-gray-300 text-sm font-medium mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Пароль
              </label>
              <div className="relative">
                <input
                  id={passId}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={!!errors.password}
                  className={`w-full px-4 py-3 rounded-lg bg-gray-800 border ${
                    errors.password ? "border-mech" : "border-gray-700"
                  } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brass transition pr-12`}
                  placeholder="Минимум 3 символа, буквы + цифры"
                  required
                />
                {/* КНОПКА ПЕРЕКЛЮЧЕНИЯ ВИДИМОСТИ ПАРОЛЯ */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brass transition"
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-mech">{errors.password}</p>}
            </div>

            {/* ПОЛЕ ПОДТВЕРЖДЕНИЯ ПАРОЛЯ */}
            <div>
              <label htmlFor={pass2Id} className="block text-gray-300 text-sm font-medium mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Подтвердите пароль
              </label>
              <div className="relative">
                <input
                  id={pass2Id}
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  aria-invalid={!!errors.confirmPassword}
                  className={`w-full px-4 py-3 rounded-lg bg-gray-800 border ${
                    errors.confirmPassword ? "border-mech" : "border-gray-700"
                  } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brass transition pr-12`}
                  placeholder="Повторите пароль"
                  required
                />
                {/* КНОПКА ПЕРЕКЛЮЧЕНИЯ ВИДИМОСТИ ПОДТВЕРЖДЕНИЯ ПАРОЛЯ */}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brass transition"
                  aria-label={showConfirmPassword ? "Скрыть подтверждение" : "Показать подтверждение"}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-mech">{errors.confirmPassword}</p>}
            </div>

            {/* КНОПКА ОТПРАВКИ ФОРМЫ */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-4 bg-brass hover:bg-yellow-600 text-black font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(180,141,87,0.4)] hover:shadow-[0_0_30px_rgba(180,141,87,0.6)]"
            >
              {loading ? (
                // ИНДИКАТОР ЗАГРУЗКИ ПРИ ОТПРАВКЕ
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" /> Зарегистрироваться
                </>
              )}
            </button>
          </form>

          {/* ССЫЛКА НА СТРАНИЦУ ВХОДА ДЛЯ СУЩЕСТВУЮЩИХ ПОЛЬЗОВАТЕЛЕЙ */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Уже есть аккаунт?{" "}
              <Link to="/profile" className="text-brass hover:text-yellow-400 font-medium transition">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




// Комментарии объясняют:

// 1. Архитектуру и структуру компонента

// Назначение страницы регистрации в контексте Warhammer 40,000 Fandom Wiki
// Организацию кода и разделение ответственности

// 2. Систему валидации данных

// Использование Zod для строгой типизации и валидации
// Правила для каждого поля формы
// Обработку опциональных полей (email)

// 3. Управление состоянием формы

// Хранение данных формы и ошибок
// Обработку изменений полей в реальном времени
// Очистку ошибок при редактировании

// 4. Процесс регистрации

// Трехэтапный процесс: валидация → регистрация → автоматический вход
// Интеграцию с Redux для управления состоянием аутентификации
// Обработку редиректов после успешной регистрации

// 5. Пользовательский опыт и доступность

// Уникальные ID для связки label-input
// Переключение видимости пароля
// Визуальную обратную связь при загрузке и ошибках
// Адаптивный дизайн для всех устройств

// 6. Обработку ошибок

// Клиентскую валидацию через Zod
// Серверную валидацию с анализом ответов API
// Умную привязку ошибок к соответствующим полям формы

// 7. Тематическое оформление

// Стилизацию в духе Warhammer 40,000
// Использование цветовой палитры проекта (brass, mech, gray)
// Иконки и визуальные элементы, соответствующие вселенной

// Страница регистрации обеспечивает плавный и безопасный процесс создания аккаунта
// с учетом особенностей тематики Warhammer 40,000 и требований современного веб-приложения.




