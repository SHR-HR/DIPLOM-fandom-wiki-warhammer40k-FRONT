import { useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { LogIn } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { login } from "./authSlice";
import { consumeReturnTo } from "@/api/client";

/**
 * УНИВЕРСАЛЬНАЯ ФОРМА ВХОДА В WARHAMMER 40,000 FANDOM WIKI
 * 
 * Адаптивная форма входа, поддерживающая различные режимы аутентификации:
 * - "local": режим локальной разработки (требуется только логин)
 * - "basic" | "hybrid": режимы продакшн (требуются логин и пароль)
 * 
 * Особенности:
 * - Автоматическое определение обязательных полей по режиму
 * - Интеграция с системой редиректов после успешной аутентификации
 * - Обработка истечения сессии через параметр URL expired=1
 * - Поддержка доступности и темной/светлой тем
 */
export default function LoginForm() {
  // ИНИЦИАЛИЗАЦИЯ ХУКОВ ДЛЯ УПРАВЛЕНИЯ СОСТОЯНИЕМ И НАВИГАЦИЕЙ
  const d = useAppDispatch();
  const nav = useNavigate();
  const [sp] = useSearchParams();

  /**
   * ПОЛУЧЕНИЕ РЕЖИМА АУТЕНТИФИКАЦИИ ИЗ REDUX STORE
   * 
   * Определяет поведение формы:
   * - "local": только логин (для разработки)
   * - "basic" | "hybrid": логин и пароль (для продакшн)
   */
  const mode = useAppSelector((s) => s.auth.mode);

  // СОСТОЯНИЯ ФОРМЫ
  const [username, setU] = useState("");     // Логин пользователя
  const [password, setP] = useState("");     // Пароль (не используется в local режиме)
  const [loading, setLoading] = useState(false); // Индикатор загрузки

  // ГЕНЕРАЦИЯ УНИКАЛЬНЫХ ID ДЛЯ ДОСТУПНОСТИ
  const loginId = useId();
  const passId = useId();

  /**
   * ОБРАБОТЧИК ВЫПОЛНЕНИЯ ВХОДА В СИСТЕМУ
   * 
   * Выполняет многоуровневую аутентификацию:
   * 1. Валидация полей в зависимости от режима
   * 2. Отправка запроса аутентификации через Redux
   * 3. Обработка успешного и неуспешного сценариев
   * 4. Навигация после успешного входа
   */
  const handleLogin = async () => {
    // ВАЛИДАЦИЯ ПОЛЕЙ В ЗАВИСИМОСТИ ОТ РЕЖИМА
    if (mode === "local") {
      if (!username.trim()) {
        toast.error("Введите логин");
        return;
      }
    } else {
      if (!username.trim() || !password.trim()) {
        toast.error("Заполните все поля");
        return;
      }
    }

    setLoading(true);
    try {
      // ВЫПОЛНЕНИЕ ЗАПРОСА АУТЕНТИФИКАЦИИ ЧЕРЕЗ REDUX
      await d(login({ username, password })).unwrap();
      toast.success("Успешный вход");

      /**
       * ОБРАБОТКА РЕДИРЕКТА ПОСЛЕ УСПЕШНОГО ВХОДА
       * 
       * Приоритеты навигации:
       * 1. Параметр expired=1 в URL (истекшая сессия)
       * 2. Сохраненный маршрут из sessionStorage (consumeReturnTo)
       * 3. Корневая страница ("/") по умолчанию
       * 
       * replace: true - заменяет текущую запись в истории браузера
       */
      const fromExpired = sp.get("expired") === "1";
      const target = consumeReturnTo();
      if (fromExpired) {
        nav(target || "/", { replace: true });
      } else {
        nav(target || "/", { replace: true });
      }
    } catch {
      // ОБРАБОТКА ОШИБКИ АУТЕНТИФИКАЦИИ
      toast.error("Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
  };

  /**
   * ВЫЧИСЛЕНИЕ СОСТОЯНИЯ АКТИВНОСТИ КНОПКИ ВХОДА
   * 
   * В local режиме: проверяем только логин
   * В других режимах: проверяем логин и пароль
   * Также учитываем состояние загрузки
   */
  const disabled =
    mode === "local"
      ? !username.trim() || loading
      : !(username.trim() && password.trim()) || loading;

  return (
    <div
      className="
        max-w-md mx-auto p-8 rounded-2xl border-2 border-brass
        bg-white text-gray-900 shadow-[0_12px_28px_rgba(0,0,0,.08)]
        dark:bg-gradient-to-br dark:from-gray-900 dark:to-black dark:text-gray-100
      "
    >
      {/* ЗАГОЛОВОК ФОРМЫ С ИКОНКОЙ */}
      <div className="flex items-center gap-3 mb-6">
        <LogIn className="w-6 h-6 text-brass" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-brass">Вход в систему</h2>
      </div>

      {/* ГРУППА ПОЛЕЙ ВВОДА */}
      <div className="space-y-4">
        {/* ПОЛЕ ВВОДА ЛОГИНА */}
        <div>
          <label
            htmlFor={loginId}
            className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
          >
            Логин
          </label>
          <input
            id={loginId}
            name="login"
            type="text"
            autoComplete="username"
            className="
              w-full px-4 py-3 rounded-lg
              bg-white border border-gray-300 text-gray-900 placeholder-gray-400
              focus:ring-2 focus:ring-brass focus:border-brass outline-none transition
              dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400
            "
            placeholder="Введите логин"
            value={username}
            onChange={(e) => setU(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        {/* ПОЛЕ ВВОДА ПАРОЛЯ (АДАПТИРУЕТСЯ ПОД РЕЖИМ) */}
        <div>
          <label
            htmlFor={passId}
            className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
          >
            Пароль{mode === "local" ? " (не требуется)" : ""}
          </label>
          <input
            id={passId}
            name="password"
            type="password"
            autoComplete="current-password"
            disabled={mode === "local"}
            className="
              w-full px-4 py-3 rounded-lg
              bg-white border border-gray-300 text-gray-900 placeholder-gray-400
              focus:ring-2 focus:ring-brass focus:border-brass outline-none transition
              dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400
              disabled:opacity-60
            "
            placeholder={mode === "local" ? "В local можно оставить пустым" : "Введите пароль"}
            value={password}
            onChange={(e) => setP(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        {/* КНОПКА ВХОДА С АДАПТИВНЫМ ТЕКСТОМ */}
        <button
          type="button"
          className="
            w-full py-3 px-6 font-bold rounded-lg transition
            bg-brass text-black hover:brightness-105
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          onClick={handleLogin}
          disabled={disabled}
        >
          {loading ? "Вход..." : "Войти"}
        </button>
      </div>
    </div>
  );
}





// Комментарии объясняют:

// 1. Адаптивную архитектуру формы

// Поддержку различных режимов аутентификации (local, basic, hybrid)
// Динамическую валидацию полей в зависимости от режима
// Интеграцию с системой состояний Redux

// 2. Пользовательский опыт

// Интуитивные подсказки о необходимости пароля в разных режимах
// Поддержку клавиши Enter для быстрого входа
// Визуальную обратную связь через состояния загрузки и ошибок

// 3. Систему навигации после входа

// Восстановление предыдущего маршрута через consumeReturnTo
// Обработку истечения сессии через параметр expired=1
// Защиту истории браузера через replace навигацию

// 4. Безопасность и доступность

// Правильные autocomplete атрибуты для менеджеров паролей
// Семантическую разметку с связанными label и input
// Поддержку темной темы через условные CSS классы

// 5. Обработку ошибок

// Защиту от пустых полей на клиенте
// Унифицированную обработку ошибок сервера
// Понятные сообщения для пользователя

// Компонент LoginForm обеспечивает надежный и удобный интерфейс 
// аутентификации для Warhammer 40,000 Fandom Wiki, адаптируясь к различным 
// режимам работы системы и предоставляя плавный пользовательский опыт при входе в систему.





