# GrowCore — полная документация / Full Project Documentation

> Актуально по состоянию кода на 20 июня 2026 года. Документ описывает реализованное поведение, а не только задуманную концепцию.
>
> Accurate to the codebase as of 20 June 2026. This document describes implemented behavior, not only the intended concept.

---

# Русская версия

## 1. Что такое GrowCore

GrowCore — full-stack маркетплейс оборудования для умного сада, теплиц, гидропоники и автоматизации полива. В одной системе объединены публичный каталог, личный кабинет покупателя, заявки продавцов, магазины продавцов, модерация товаров, платежи Stripe, доставка и возвраты, социальные функции, чат, уведомления, поддержка и административная панель.

Система рассчитана на четыре роли:

- **Гость** просматривает каталог, карточки товаров, пользователей и информационные страницы; может временно собирать корзину и избранное в состоянии текущей страницы.
- **Пользователь (`user`)** получает постоянную серверную корзину и избранное, оформляет и оплачивает заказы, оставляет отзывы, подписывается, добавляет друзей, общается, получает уведомления и создаёт обращения.
- **Продавец (`seller`)** дополнительно управляет магазином и собственными товарами.
- **Поддержка (`support`)** работает с обращениями пользователей.
- **Администратор (`admin`)** модерирует продавцов и товары, управляет пользователями, транзакциями, категориями, возвратами, доставкой и видимостью магазинов в фильтрах.

Роли не взаимоисключающие: связь пользователей и ролей many-to-many, поэтому один аккаунт может иметь несколько ролей.

## 2. Пользовательский интерфейс и навигация

Frontend — адаптивное одностраничное приложение React. Общий каркас содержит верхнюю панель, шапку с поиском и счётчиками, каталог категорий, меню аккаунта, мобильное меню, нижнюю мобильную навигацию, боковую панель категорий, footer и глобальные toast-уведомления.

Основные маршруты:

| Маршрут | Назначение | Доступ |
|---|---|---|
| `/` | Главная: hero-блок, категории, подборка товаров, преимущества | всем |
| `/catalog` | Каталог с серверными фильтрами, сортировкой и пагинацией | всем |
| `/product/:productId` | Полная карточка товара | всем; отзывы требуют входа |
| `/cart`, `/favorites` | Корзина и сохранённые товары | всем, серверное хранение после входа |
| `/login`, `/register` | Вход и регистрация | всем |
| `/profile` | Редактирование профиля и аватара | авторизованным |
| `/orders`, `/payment`, `/returns` | Заказы, Stripe-оплата и возвраты | авторизованным по факту API |
| `/notifications`, `/friends` | Уведомления и друзья | авторизованным |
| `/users`, `/users/:publicId` | Поиск, социальная зона, чаты и публичный профиль | просмотр всем; действия после входа |
| `/seller-request` | Подача/повторная подача заявки продавца | API требует входа |
| `/seller/store`, `/seller/products/new`, `/seller/products/:id/edit` | Кабинет магазина и товары | продавцу |
| `/support`, `/support-panel` | Обращения пользователя и рабочее место поддержки | авторизованным; панель — support/admin |
| `/admin` | Административная панель | администратору |
| `/delivery`, `/about` | Информационные страницы | всем |
| `*` | Страница 404 | всем |

Интерфейс имеет состояния загрузки, пустых списков и ошибок; API-ошибки преобразуются в понятные сообщения. Axios автоматически один раз обновляет access token при `401`, повторяет исходный запрос и не запускает несколько refresh-запросов одновременно. React Query настроен глобально, хотя основная feature-логика сейчас использует собственные hooks и `useEffect`.

### 2.1. Подробное описание страниц и действий пользователя

**Главная страница.** Посетитель начинает работу с крупного вводного блока, который объясняет назначение GrowCore и ведёт в каталог. Ниже показываются категории оборудования, карточки доступных товаров и блок преимуществ сервиса. Из товарной карточки можно сразу открыть подробности, положить одну единицу в корзину или переключить состояние избранного. Цена в карточке учитывает активную скидку, а визуальные элементы показывают рейтинг, изображение и доступность товара. Главная страница использует реальные категории и товары backend, поэтому после административного изменения каталога её содержимое также меняется.

**Шапка и навигация.** Поисковая строка переводит пользователя в каталог и передаёт запрос через URL, поэтому результат можно обновить или открыть по сохранённой ссылке. Каталог категорий позволяет сразу ограничить выдачу. Рядом находятся переходы в избранное, корзину и аккаунт; счётчики показывают количество сохранённых позиций, строк корзины, непрочитанных уведомлений и входящих заявок в друзья. Для маленького экрана те же действия перенесены в мобильное меню и нижнюю навигацию. Авторизованному пользователю меню аккаунта открывает профиль, заказы, уведомления и доступные ему ролевые разделы.

**Каталог.** Страница состоит из панели фильтров и сетки товаров. Пользователь может одновременно выбрать категорию, несколько продавцов, нижнюю и верхнюю цену, наличие, маркетинговые метки и значения динамических характеристик. Выбранные параметры отправляются backend, то есть фильтрация выполняется по всему каталогу, а не только среди уже загруженных карточек. Изменение фильтра или сортировки возвращает пользователя на первую страницу. Пагинация показывает по 32 позиции; если текущая страница стала недоступной после фильтрации, приложение корректирует её до последней существующей. Пустая выдача предлагает изменить или сбросить условия.

**Карточка товара.** Слева находится основное изображение и переключаемая галерея, справа — название, рейтинг, цена, скидка, остаток и выбор количества. Количество нельзя увеличить выше доступного остатка. Кнопка покупки добавляет выбранное количество, а сердце сохраняет или удаляет товар из избранного. Ниже расположены вкладки с развернутым описанием, характеристиками и отзывами. Отзыв содержит автора, оценку, дату и текст; ответы отображаются внутри той же ветки. Авторизованный пользователь может написать собственный отзыв, а участники — ответить на корневой отзыв. В конце страницы отображается подборка связанных товаров.

**Корзина.** Каждая строка содержит изображение, ссылку на товар, актуальную цену, количество, максимальный доступный остаток и кнопку удаления. Изменение количества сразу отражается визуально, а серверный запрос откладывается на 600 мс, чтобы несколько быстрых нажатий не создавали лишние обращения. Сводный блок пересчитывает стоимость. Кнопка оформления для гостя просит войти; для пользователя она создаёт новый неоплаченный заказ, очищает серверную корзину и предлагает перейти к оплате. Если за время нахождения в корзине цена, публикация или остаток изменились, backend повторно проверяет данные и не создаёт некорректный заказ.

**Избранное.** Страница показывает сохранённые товарные карточки и позволяет удалить отдельный товар, добавить его в корзину либо перенести все доступные позиции одной командой. Массовый перенос выполняется последовательно и отдельно сообщает о полностью успешном, частично успешном или невозможном результате. Товар остаётся сохранённым, если он закончился или корзина уже содержит максимальное доступное количество.

**Регистрация и вход.** Формы удаляют случайные пробелы, проверяют обязательные значения и показывают серверные сообщения об ошибках. После успешной регистрации приложение сразу выполняет вход и загружает полный профиль. При последующих открытиях страницы сессия восстанавливается через cookie. Если короткий access token истёк, пользователь обычно не замечает этого: клиент использует refresh token и повторяет исходное действие. Если обновление невозможно, защищённый маршрут переводит на вход.

**Профиль.** Личная страница объединяет карточку пользователя, форму изменения username и описания, редактор аватара и быстрые ссылки, соответствующие ролям аккаунта. Перед загрузкой изображения показывается локальный preview; пользователь может подтвердить замену или удалить существующий avatar. После сохранения AuthContext обновляется, поэтому новое имя или изображение сразу появляется в общей шапке без перезагрузки приложения.

**Поиск пользователей и социальный центр.** Страница `/users` имеет отдельные режимы общего списка, друзей, заявок и чатов. Общий список ищет по имени или public ID и разбивается на страницы. Дополнительная форма точного поиска принимает ID вида `#A1B2C3D4E5`. Раздел друзей имеет собственный поиск и пагинацию. Во входящих заявках видны отправитель, его сообщение и кнопки принятия/отклонения. В чатах слева выбирается диалог, а справа загружается история и форма отправки. Переключение вкладок не требует перехода на отдельную страницу.

**Публичный профиль.** Здесь видны публичные данные другого пользователя и доступные социальные действия. Вошедший пользователь может подписаться или отписаться, отправить заявку в друзья с сопроводительным текстом, отменить дружбу и открыть переписку с другом. Интерфейс различает исходящую и входящую ожидающую заявку и не предлагает повторное действие. Если профиль принадлежит продавцу, отдельная вкладка показывает описание магазина и опубликованные товары. Администратору дополнительно показывается блок блокировки/разблокировки с обязательным объяснением причины.

**Друзья.** Отдельная компактная страница `/friends` предназначена для быстрого просмотра и поиска уже принятых друзей. Карточка ведёт в публичный профиль, где доступны управление дружбой и чат. Пустое состояние объясняет, что новых друзей следует добавлять из публичных профилей.

**Заказы.** История сначала получает все заказы текущего пользователя и разделяет их на оплаченные и ожидающие оплаты. Карточка показывает номер, дату, сумму, позиции и цепочку статусов. Для неоплаченного заказа доступны переход к Stripe и удаление. Для оплаченного — сведения об оплате, доставке, tracking и запрос возврата. После возвращения со Stripe страница считывает `session_id`, просит backend подтвердить checkout, повторно загружает заказы и обновляет корзину. Повторное подтверждение безопасно благодаря идемпотентной серверной логике.

**Оплата.** На странице перечислены только заказы со статусом `pending`; заказ из query-параметра выбирается автоматически, иначе выбирается первый. Справа показан состав и итог. GrowCore не собирает номер карты внутри своей формы: кнопка создаёт Stripe Checkout Session и перенаправляет на защищённую страницу Stripe. После оплаты Stripe возвращает пользователя в приложение, а webhook обеспечивает фиксацию результата даже при закрытии вкладки до redirect.

**Возвраты.** Пользователь выбирает собственный заказ, вводит email и подробно описывает причину. Email используется формой как контактное поле, тогда как в текущий API возврата передаются идентификатор заказа и причина. Успешное действие меняет статус заказа на ожидающий рассмотрения. На этой же странице размещена статическая памятка об упаковке электронных компонентов. Запрос можно также создать непосредственно из карточки заказа.

**Уведомления.** Непрочитанные записи визуально отличаются. Клик по уведомлению сначала отмечает его прочитанным, затем открывает связанную страницу, если ссылка существует. Доступны массовая отметка и полная очистка истории; после каждого действия глобальный счётчик обновляется. Пагинация сохраняет страницу в пределах существующего диапазона после удаления элементов.

**Заявка продавца.** Страница сначала объясняет преимущества продавца, затем проверяет текущую заявку аккаунта. При отсутствии заявки показывается полная форма и загрузка документа. Для `pending`/`approved` отображается состояние и отправленные данные без повторной отправки. Для `rejected` показывается причина, поля снова становятся доступными, а новый файл обязателен. После одобрения быстрые ролевые ссылки ведут в магазин продавца.

**Магазин продавца.** В верхнем блоке продавец редактирует название и описание магазина. Ниже расположены поиск по собственным товарам, кнопка создания и список карточек со статусом модерации, ценой, остатком и датой. В зависимости от состояния доступны редактирование, управление доступностью и удаление с обязательной причиной. Ошибка одного действия не разрушает загруженный список, а успешное изменение обновляет данные.

**Создание и редактирование товара.** Форма собирает название, цену, процент и окончание скидки, остаток, категорию, структурированные части описания и фильтруемые характеристики. Для нового товара изображение обязательно: UI создаёт draft, отдельно загружает файл и затем отправляет запись на модерацию. Редактор существующего товара загружает текущие значения и изображения; можно сохранить изменения как draft или сразу сохранить и отправить. Перед отправкой проверяются обязательные секции, Brand, Warranty и заполненность характеристик. Отдельный блок показывает загруженные изображения и позволяет удалить конкретное.

**Поддержка пользователя.** Верхняя часть показывает прошлые обращения, ответ сотрудника, назначенного специалиста, тип, даты и статус. Ниже форма создаёт новое обращение с категорией, темой и подробным сообщением. После отправки первая страница списка загружается повторно, поэтому новое обращение появляется сразу.

**Панель поддержки.** Состояние фильтра и номер страницы хранятся в URL. Сотрудник может искать обращения, раскрывать карточку, назначать её себе, подготовить ответ и изменить статус. Система запрещает обычному support-пользователю редактировать чужое назначенное обращение; администратор может работать со всеми. Из карточки доступен профиль автора, а admin может заблокировать его при выявленном нарушении.

**Административная панель.** Данные разных вкладок загружаются независимо через `Promise.allSettled`, поэтому временная ошибка одного раздела не делает всю панель бесполезной. Модальные окна показывают полные сведения о товаре или заявке перед решением. Все опасные действия требуют явной причины либо подтверждение. Собственные поиск, фильтры и пагинация существуют для товаров, пользователей, заявок и транзакций. Категории можно упорядочить числом `sort_order` и связать с иконкой, а список продавцов для фильтра настраивается отдельными переключателями.

**Информационные страницы.** `/about` объясняет специализацию платформы и принципы модерации, безопасности заказов и поддержки. `/delivery` содержит пользовательскую памятку о вариантах доставки и упаковке. Footer связывает каталог, информацию о компании, доставку, возвраты и контакты. Неизвестный URL открывает отдельную 404-страницу с возвратом к рабочим разделам.

## 3. Аккаунт и аутентификация

- Регистрация принимает username, email и пароль. Username очищается от пробелов; email нормализуется; проверяется уникальность.
- Пароль должен содержать 6–72 символа и хранится как bcrypt-хеш с 12 раундами.
- После регистрации frontend автоматически выполняет вход.
- JWT находятся только в cookies. Access token живёт 1 час, refresh token — 80 дней.
- Cookie-параметры `Secure` и `SameSite` задаются окружением; production-пример использует `Secure=true`, `SameSite=none`.
- Logout удаляет обе cookies.
- CSRF-защита cookies в текущей конфигурации отключена.
- Каждый пользователь получает UUID и публичный ID формата `#A1B2C3D4E5`, пригодный для поиска и публичных URL.
- Заблокированный аккаунт хранит флаг и причину блокировки; блокировка учитывается в бизнес-операциях.

В профиле можно изменить username и описание (до 300 символов), загрузить или удалить аватар. Аватары принимаются в JPEG, PNG или WebP, проверяются по MIME и сигнатуре, ограничены 3 MiB и сохраняются локально либо в Cloudinary.

## 4. Каталог и товары

Публичный каталог показывает только включённые товары со статусом модерации `approved`. Сервер поддерживает:

- текстовый поиск;
- категорию;
- минимальную и максимальную цену;
- одного или нескольких продавцов, включая группу «Other»;
- наличие (`in-stock`/`out-of-stock`);
- метки: скидка, новый товар (до 30 дней), высокий рейтинг (от 4), популярный (от 10 оценок);
- динамические фильтры по произвольным атрибутам товара;
- сортировки `popular`, `price-asc`, `price-des`, `new`, `random`;
- `limit/offset`-пагинацию (1–100 элементов; UI каталога использует 32).

Карточка товара содержит галерею, название, обычную и скидочную цену, остаток, среднюю оценку и число оценок, продавца, категорию, описание, атрибуты, выбор количества, кнопки корзины/избранного, условия доставки и гарантии, отзывы и связанные товары.

Скидка задаётся процентом 0–100 и необязательной датой окончания. Расчётная цена округляется до двух знаков; истёкшая скидка автоматически перестаёт считаться активной.

Описание продавца структурировано секциями `Overview`, `Use case`, `Compatibility`, `Package includes`, `Characteristics`. Для атрибутов обязательны `Brand` и `Warranty`; дополнительные варианты предлагаются по категории, а продавец может запросить новый произвольный фильтр.

## 5. Отзывы и ответы

- Авторизованный пользователь может оставить товару одну оценку от 1 до 5 и текстовый комментарий.
- Вторая оценка того же товара тем же пользователем запрещена.
- Средняя оценка и счётчик обновляются при создании отзыва.
- На корневой оценённый отзыв можно отвечать текстом до 2000 символов.
- Ответы не имеют рейтинга и не влияют на среднюю оценку; вложенные ответы второго уровня запрещены.
- При удалении пользователя автор отзыва становится `NULL`, но отзыв сохраняется.

## 6. Корзина, избранное и создание заказа

Для вошедшего пользователя существует одна серверная корзина. Добавление проверяет, что товар опубликован, включён и есть в нужном количестве. Повторное серверное добавление увеличивает количество, а UI карточки предотвращает случайный дубль. Изменение количества в интерфейсе отправляется с debounce 600 мс. Можно удалить позицию или очистить корзину.

Checkout не списывает деньги: он создаёт неоплаченный заказ из актуального содержимого корзины и очищает корзину. Цена каждой строки фиксируется на момент оформления с учётом действующей скидки. Для каждой строки считается **комиссия платформы 10%** и сумма продавца; итоги сохраняются в заказе. Остаток уменьшается только при успешной оплате, с повторной транзакционной проверкой наличия.

Избранное поддерживает добавление, удаление, пагинацию, перенос одной позиции в корзину и массовый перенос доступных товаров. Недоступные или достигшие максимума позиции остаются в избранном.

У гостя корзина и избранное существуют только в React-состоянии текущего запуска приложения: в `localStorage` они не сохраняются и автоматически с серверным аккаунтом не сливаются.

## 7. Заказы, Stripe, доставка и возвраты

Заказ хранит позиции, итог, комиссию, пользователя и четыре независимых статуса:

- общий: `in Transit`, `delivered`, `delayed`, `returned`;
- оплата: `pending`, `paid`, `refunded`, `failed`;
- доставка: `preparing`, `in_transit`, `delivered`, `delayed`;
- возврат: `none`, `requested`, `approved`, `rejected`, `refunded`.

Пользователь видит историю, разделённую на оплаченные и неоплаченные заказы, прогресс доставки, позиции, реквизиты и документы. Неоплаченный заказ можно удалить; оплаченный — нельзя. Удаление неоплаченного заказа не требует возврата остатков, поскольку склад ещё не был уменьшен.

Основной платёжный сценарий:

1. Пользователь создаёт заказ из корзины.
2. На `/payment` выбирает неоплаченный заказ.
3. Backend создаёт Stripe Checkout Session с позициями, metadata, разрешёнными странами, валютой и опциональным automatic tax.
4. Stripe собирает карту, имя, адрес доставки и при настройке NIF/налоговые данные.
5. После redirect frontend подтверждает session; параллельно поддерживается подписанный Stripe webhook.
6. Идемпотентная серверная логика помечает заказ оплаченным, фиксирует transaction/session ID, метод, адрес и платёжный документ, затем уменьшает склад.

Существует также API ручной фиксации оплаты с transaction ID, методом, платёжным документом, адресом и NIF, хотя текущая страница оплаты ведёт пользователя через Stripe.

Возврат можно запросить для собственного оплаченного заказа, указав причину 10–400 символов. Администратор одобряет возврат; платежный статус становится `refunded`, статус возврата — `refunded`, общий статус — `returned`. Администратор также меняет состояние доставки и tracking number.

Информационная страница доставки описывает стандартную доставку 3–5 рабочих дней, защищённую упаковку и pickup point. Это статический текст интерфейса, а не расчёт тарифов перевозчика.

## 8. Продавцы, магазины и модерация

### Получение роли продавца

Авторизованный пользователь подаёт одну заявку с passport ID (8–10 символов), ФИО, телефоном, страной, сообщением и подтверждающим документом. Допустимы PDF/JPEG/PNG до 10 MiB; файл проверяется по содержимому и хранится приватно. Passport ID и телефон уникальны.

Статусы заявки: `pending`, `approved`, `rejected`. После отклонения пользователь видит причину, может исправить данные, заменить документ и повторно отправить заявку. Администратор фильтрует и просматривает заявки, безопасно открывает приватный документ, одобряет или отклоняет с причиной от 10 символов.

Одобрение атомарно выдаёт роль `seller`, создаёт магазин пользователя и отправляет уведомление. Отклонение также уведомляет пользователя.

### Магазин и товары продавца

У продавца один магазин с названием (3–100 символов), описанием до 300 символов и датой создания. Публичный профиль продавца показывает магазин и опубликованные товары.

Жизненный цикл товара: `draft` → `pending` → `approved`; при проблемах доступны `rejected`, `blocked`, `deleted`.

- Продавец создаёт draft: название 5–200 символов, структурированное описание от 20 символов, цена, скидка и срок, остаток, категория, атрибуты.
- Загружает JPEG/PNG/WebP изображения до 8 MiB каждое; файлы имеют стабильный изолированный prefix товара.
- Редактировать можно draft или rejected. Исправление rejected сбрасывает его в draft.
- Отправка на модерацию требует валидной категории, заполненных данных и изображения.
- Одобренный товар продавец может включать/выключать; включить товар с нулевым остатком нельзя.
- Неопубликованный товар можно удалить с причиной; административное удаление является soft delete для сохранения ссылочной целостности заказов.

Администратор просматривает очередь, детали, изображения и атрибуты; одобряет, отклоняет с причиной, блокирует или удаляет товар. Продавцу приходят сгруппированные уведомления о результате. При одобрении доступность автоматически зависит от остатка.

Отдельный флаг `show_in_filters` определяет, показывается ли магазин именованным пунктом фильтра продавцов. Остальные магазины доступны в группе «Other».

## 9. Пользователи и социальные функции

Публичный профиль показывает avatar, username, public ID, роли, описание, дату регистрации, количество подписчиков/подписок и, для продавца, магазин с товарами.

Поиск работает:

- по username или public ID в пагинированном списке пользователей;
- точным запросом публичного ID;
- отдельно внутри списка друзей.

Подписки односторонние. Нельзя подписаться на себя, повторно подписаться или взаимодействовать с заблокированным пользователем. На пару пользователей действует лимит до 6 follow/unfollow-действий в час. Счётчики обновляются в базе; подписка создаёт уведомление, которое ограничивается/группируется, чтобы не спамить.

Дружба двусторонняя и начинается заявкой с необязательным сообщением до 500 символов. Получатель видит входящие заявки и счётчик, принимает или отклоняет их. Принятие создаёт симметричные связи дружбы и уведомляет отправителя. Друга можно удалить.

## 10. Чат и real-time

Чат доступен между друзьями. Социальная страница объединяет вкладки пользователей, друзей, заявок и чатов. Есть список диалогов с последним сообщением, история переписки и окно отправки; URL внутри текста сообщения автоматически становятся ссылками.

Сообщение содержит 1–15 000 символов. Интерфейс показывает текущую длину, выделяет превышение лимита и при попытке отправки выводит toast с максимально допустимым размером. Между отправками действует серверный интервал 1 секунда. REST API позволяет загрузить историю и отправить сообщение. WebSocket `/users/ws/chats` доставляет новые сообщения и события сразу всем активным соединениям обоих участников.

Для production frontend сначала получает JWT-ticket сроком 60 секунд через аутентифицированный HTTP API, затем подключается напрямую к backend по `VITE_WS_URL`. Это обходит ограничение Vercel rewrites, которые не проксируют WebSocket Upgrade. Локально Vite proxy поддерживает `ws: true`. Cookie может использоваться как fallback при прямом same-site соединении.

## 11. Уведомления

Уведомление содержит заголовок, текст, ссылку, время, признак прочтения, `group_key` и число повторений. События с одним ключом объединяются в пределах 5 минут: обновляется существующая запись и растёт `occurrence_count`.

Источники включают подписки, заявки в друзья, сообщения, решения по заявке продавца, модерацию товаров, назначение/ответ поддержки и изменения связанных процессов. Пользователь может просматривать уведомления с пагинацией (UI — по 10), открыть связанную страницу, отметить одно или все прочитанными и удалить все. Счётчики в desktop/mobile навигации обновляются пользовательскими browser events.

## 12. Поддержка

Пользователь создаёт обращение с темой до 150 символов, сообщением до 2000 символов и типом: `account`, `order`, `payment`, `return_request`, `seller`, `technical`, `other`. В личном help center отображается история ответов и статусов с пагинацией.

Статусы: `open`, `in_progress`, `resolved`, `closed`. Сотрудник поддержки или администратор фильтрует обращения по статусу, ищет по тексту/пользователю, раскрывает детали и назначает обращение себе. Обычный support-сотрудник может изменять только назначенное ему обращение; admin имеет расширенный доступ. Можно написать/обновить ответ и сменить статус. Назначение и ответ создают уведомления пользователю; `resolved_at` ведётся автоматически.

Администратор из support-panel также может заблокировать пользователя с обязательной причиной.

## 13. Административная панель

Панель состоит из семи вкладок:

1. **Product moderation** — очередь pending, подробный modal, approve/reject.
2. **Product controls** — все товары, просмотр, блокировка и soft delete с причиной.
3. **Transactions** — пагинированные заказы, фильтр по payment status, суммы, 10% fee, Stripe/session ID, доставка, возврат, tracking и платёжный документ; изменение доставки и одобрение возврата выполняются API.
4. **Seller requests** — просмотр данных и приватного документа, approve/reject.
5. **Users** — поиск и пагинация, public ID/роли/блокировка, переход в профиль.
6. **Categories** — создание, переименование, icon Lucide, sort order и удаление.
7. **Filter sellers** — включение/выключение именованного магазина в фильтре каталога.

Управление категориями требует одновременно admin-cookie и отдельный заголовок `X-Category-Secret`. UI запрашивает секрет в modal и не хранит его как обычную публичную конфигурацию.

## 14. Данные и связи

Основные таблицы:

- `users`, `roles`, `user_roles` — аккаунты и роли;
- `stores`, `seller_requests` — магазины и проверка продавцов;
- `categories`, `products`, `product_images`, `reviews` — каталог, изображения и древовидные отзывы;
- `carts`, `cart_items`, `favorites` — покупательское состояние;
- `orders`, `order_items` — финансовый и логистический snapshot покупки;
- `user_follows`, `user_follow_events`, `user_friends`, `user_friend_requests`, `user_chat_messages` — социальный граф, rate-limit audit и чат;
- `notifications` — сгруппированные события;
- `support_tickets` — обращения и назначение сотруднику.

Большинство сущностей имеют timestamps через общую declarative base. Внешние ключи используют `CASCADE`, `SET NULL` или soft deletion в зависимости от необходимости сохранить историю. Alembic содержит последовательные миграции от базовой схемы до скидок, атрибутов, друзей, чатов, уведомлений, поддержки, Stripe, возвратов, комиссии и безопасного удаления товаров.

## 15. Архитектура

```text
Browser / React 19 + Vite
  ├─ pages + reusable components
  ├─ feature hooks and AuthContext
  └─ Axios REST + native WebSocket
                 │
                 ▼
FastAPI
  ├─ routers: HTTP/WebSocket boundary
  ├─ dependencies: auth, roles, service injection
  ├─ services: business rules and transactions
  ├─ Pydantic schemas: validation/serialization
  └─ async SQLAlchemy models
                 │
        ┌────────┼─────────┐
        ▼        ▼         ▼
 PostgreSQL  Cloudinary/  Stripe
             local files  Checkout
```

Backend полностью асинхронный на FastAPI + SQLAlchemy/asyncpg. Router остаётся тонким, а транзакции, проверки доступа и изменения связанных сущностей находятся в service-слое. Pydantic DTO отделяют API-контракты от ORM. Публичные и приватные файлы обслуживаются общей абстракцией с backend `local` или `cloudinary`.

## 16. Технологии

- Frontend: React 19, React Router 7, Vite 8, Tailwind CSS 4, Axios, TanStack Query, Ant Design, Lucide React.
- Backend: Python 3.12, FastAPI, Pydantic 2, async SQLAlchemy 2, Alembic, AuthX, bcrypt, Uvicorn.
- Данные и интеграции: PostgreSQL 16, Cloudinary, Stripe Checkout/Webhooks.
- Deployment: Docker/Docker Compose, Render-совместимый backend, Vercel SPA frontend.

## 17. Конфигурация и запуск

Скопируйте `backend/.env.example` в `backend/.env` и `frontend/.env.example` в `frontend/.env`, задайте значения и выполните:

```powershell
docker compose up --build
```

- frontend: `http://localhost:5173`
- backend: `http://localhost:8000`
- OpenAPI: `http://localhost:8000/docs`
- health check: `http://localhost:8000/health`

Compose запускает PostgreSQL 16, ждёт его health check, применяет Alembic-миграции с пятью попытками, затем поднимает Uvicorn. Vite проксирует `/api`, `/media`, `/storage` и локальные WebSocket-соединения. Backend может автоматически создать роли, staff-аккаунты и демонстрационный каталог; каждый seed управляется переменными окружения и имеет timeout.

Ключевые группы backend-переменных: `DATABASE_URL`/pool, JWT/cookies, CORS/frontend URL, local/Cloudinary storage, Stripe/currency/countries/tax, staff/catalog seeds и `CATEGORY_MANAGEMENT_SECRET`. Frontend использует `VITE_API_URL`, `VITE_API_PROXY_TARGET` и production `VITE_WS_URL`. Любое значение `VITE_*` попадает в browser bundle и не должно быть секретом.

## 18. Безопасность и ограничения текущей версии

Реализовано: role-based dependencies, bcrypt, HttpOnly JWT cookies через AuthX, проверка типа/сигнатуры/размера загрузок, приватные документы продавцов, параметризованные ORM-запросы, транзакционные проверки склада, подписанный Stripe webhook, отдельный admin-secret категорий, rate limits подписок и чата, нормализация public ID и ограниченный CORS.

На что следует обратить внимание перед production:

- Cookie-аутентификация использует double-submit CSRF-токены для изменяющих запросов; frontend отправляет отдельный токен для refresh-cookie.
- Публичный `POST /setup_database` удалён; seed запускается только явно настроенными startup-флагами, а catalog seed запрещён при `ENV=production`.
- В репозитории нет автоматических unit/integration/e2e тестов, хотя `pytest` установлен.
- Гостевые корзина и избранное не персистентны и не сливаются после входа.
- Информационные delivery/return тексты не являются полноценной интеграцией перевозчика или RMA.
- Одобрение возврата вызывает Stripe Refund API с идемпотентным ключом и лишь затем фиксирует возврат в базе.
- Доступ страниц `/admin` и seller-маршрутов frontend защищён только общим `ProtectedRoute`; окончательная ролевая защита корректно выполняется backend, но UX можно улучшить отдельными role guards.
- В исходниках demo seed присутствуют фиксированные тестовые seller credentials; включать catalog seed в production без пересмотра данных нельзя.
- В кодовой базе осталась неиспользуемая учебная модель `BookModel`.
- README до этой ревизии содержал повреждённую русскую кодировку; этот документ сохранён в UTF-8.

## 19. Проверка качества

Доступные ручные проверки:

```powershell
cd backend
..\.venv\Scripts\python.exe -m alembic upgrade head

cd ..\frontend
npm.cmd run lint
npm.cmd run build
```

Backend публикует интерактивную OpenAPI-схему, что позволяет проверить все REST endpoints. Отдельной команды backend lint/type-check в проекте пока нет.

---

# English version

## 1. Product overview and roles

GrowCore is a full-stack marketplace for smart-garden, greenhouse, hydroponic, and irrigation-automation equipment. It combines a public catalog, buyer accounts, seller onboarding and stores, listing moderation, Stripe payments, delivery and returns, social features, real-time chat, grouped notifications, support, and administration.

The permission model is additive and many-to-many:

- A **guest** can browse products, users, and informational pages and can build an in-memory cart/favorites list.
- A **user** gets persistent server-side cart and favorites, orders, reviews, follows, friends, chat, notifications, and support.
- A **seller** additionally manages one store and its listings.
- **support** staff process assigned tickets.
- An **admin** moderates sellers/listings and manages users, transactions, categories, delivery, returns, and catalog filter stores.

## 2. Frontend routes and application shell

The responsive React SPA provides a desktop/mobile header, catalog/search navigation, account popover, notification and friend-request counters, mobile drawer and bottom navigation, category sidebar, footer, empty/loading/error states, and global toast notices.

| Route | Feature | Access |
|---|---|---|
| `/` | Hero, categories, featured products, benefits | public |
| `/catalog` | Filtered, sorted, paginated catalog | public |
| `/product/:productId` | Product gallery, details, purchase actions, reviews | public; review actions authenticated |
| `/cart`, `/favorites` | Shopping cart and saved products | public; persistent when authenticated |
| `/login`, `/register`, `/profile` | Authentication and profile editing | profile authenticated |
| `/orders`, `/payment`, `/returns` | Order history, Stripe checkout, returns | authenticated at API level |
| `/notifications`, `/friends` | Account events and friends | authenticated |
| `/users`, `/users/:publicId` | User discovery, social hub, chat, public profile | mixed public/authenticated |
| `/seller-request` | Seller application and resubmission | authenticated API |
| `/seller/store`, `/seller/products/new`, `/seller/products/:id/edit` | Seller workspace | seller |
| `/support`, `/support-panel` | Customer help center and staff workspace | authenticated / support or admin |
| `/admin` | Seven-part administration panel | admin |
| `/delivery`, `/about` | Static information | public |

Axios uses credentials, a 10-second timeout, friendly error events, and a single-flight refresh interceptor: after an eligible `401`, it refreshes the access cookie once and retries the original request. React Query is configured globally, while most current feature loading uses dedicated hooks.

### 2.1. Detailed page-by-page behavior

**Home page.** The opening hero explains the marketplace and leads into the catalog. Real backend categories, product cards, and a service-benefits section follow it. A visitor can open a product, add one unit to the cart, or toggle its favorite state directly from a card. Cards reflect the computed discounted price, current image, rating, and availability, so catalog administration also changes the home content.

**Header and navigation.** Search redirects into the catalog and stores the query in the URL, making results refreshable and shareable. Category navigation applies the appropriate catalog restriction. Cart, saved-product, unread-notification, and pending-friend-request counters are exposed where relevant. Mobile users receive the same capabilities through a drawer and bottom navigation. The account menu links to profile, orders, notifications, and role-dependent workspaces.

**Catalog.** A filter panel controls the server-backed product grid. Category, multiple sellers, price bounds, stock state, marketing labels, and dynamic attribute values can be combined. Because the backend evaluates them, filtering covers the full dataset rather than the currently loaded page. Filter or sort changes return to page one. The UI displays 32 products per page and corrects an out-of-range page after the result set shrinks. An empty state suggests changing or resetting the query.

**Product details.** The page combines a selectable image gallery with title, rating, base/current price, discount, stock, and quantity controls. Quantity cannot exceed available inventory. Purchase and heart buttons add the selected amount or toggle saving. Lower tabs expose the structured description, technical attributes, delivery/warranty notes, and review threads. Signed-in users can add their one rated review and reply to root reviews. A related-product section provides continued catalog discovery.

**Cart.** Every line shows image, product link, effective price, quantity, stock ceiling, and removal. Quantity changes render immediately and are synchronized after a 600 ms debounce. The summary recalculates the amount. Guests are prompted to sign in at checkout; authenticated checkout creates a pending order, clears the server cart, and points toward payment. Backend revalidates publication, price, and inventory so stale browser data cannot create an invalid order.

**Favorites.** Saved cards can be removed, individually added to cart, or bulk-moved. The bulk operation handles items sequentially and reports complete success, partial success, or no movement. Out-of-stock items and items already at the cart stock ceiling remain saved.

**Registration, login, and session recovery.** Forms trim accidental whitespace, validate required input, and display server errors. Registration automatically logs in and loads the complete user. Later visits recover the cookie session. Access-token expiration is normally invisible because the client refreshes and retries; a failed refresh returns the user to authentication for protected content.

**Profile.** The account view combines identity, username/description editing, avatar editing, and role-aware shortcuts. Avatar selection gets a local preview before upload and can replace or remove the current file. Successful changes update AuthContext, so shared header identity changes without a full reload.

**User discovery and social hub.** `/users` offers user, friend, request, and chat modes. General user and friend lists have independent search and pagination; exact public-ID lookup accepts the `#A1B2C3D4E5` format. Incoming requests display the sender, optional message, accept, and decline controls. Chat mode selects a thread on the left and loads history/composer on the right without navigating away.

**Public profile.** Public identity, role, biography, counts, and join date are paired with context-sensitive actions. A signed-in visitor can follow/unfollow, send a friend request with a note, remove friendship, or chat with a friend. Pending incoming and outgoing states are distinguished to prevent duplicate requests. Seller profiles add store information and approved products. Admins receive a separate block/unblock area with mandatory reasoning.

**Friends.** `/friends` is a compact searchable view of accepted friends. Each card opens the public profile where friendship management and chat live. Its empty state explains how to add people from public profiles.

**Orders.** The page loads the current user’s history and separates paid from unpaid orders. Each card shows ID, date, total, lines, and status progress. Pending orders can be paid or deleted; paid orders expose payment, delivery, tracking, and return actions. On Stripe return, the page reads the session ID, asks the backend to confirm it, reloads history, and refreshes cart state. Repeated confirmation is safe because server finalization is idempotent.

**Payment.** Only pending orders are offered. A query-string order is preselected, otherwise the first one is used. The order composition and total appear alongside the payment action. GrowCore never collects card numbers in its React form: it creates a Checkout Session and redirects to Stripe. The webhook records payment even if the customer closes the tab before the browser redirect completes.

**Returns.** The form selects one of the user’s orders and collects contact email and a detailed reason. The current return API consumes the order ID and reason; email remains a form-side contact field. A successful request updates the order into review state. The same action is available from eligible order cards, and static packaging guidance is shown beside the form.

**Notifications.** Unread records are visually distinct. Opening one marks it read before following its optional internal link. Users can mark all as read or delete the entire history, and navigation counters update after each change. Pagination adjusts after deletion to remain within the available range.

**Seller application.** The page explains seller benefits and then loads the account’s current application. A new applicant receives the complete form and private document uploader. Pending and approved states become read-only summaries. A rejected application displays its reason, unlocks correction, and requires a replacement file. Approval makes seller workspace shortcuts available.

**Seller store.** Sellers edit store name/description and browse a searchable list of their listings. Each card shows moderation state, price, inventory, and date. Available actions vary by state: edit, availability toggle, or reasoned deletion. A failed action leaves the loaded list usable, while success refreshes it.

**Create/edit product.** Forms collect title, price, discount and expiry, stock, category, structured description sections, and filterable attributes. Creating a listing performs three explicit stages: create draft, upload required image, submit for moderation. Editing loads current values and images, then supports draft saving or save-and-submit. Submission validates required description sections, Brand, Warranty, and meaningful characteristic values. Existing images are displayed and individually removable.

**Customer support.** The help center lists the user’s ticket history, staff response, assignee, type, dates, and status. A second panel creates a categorized ticket with subject and detail. After success, page one reloads so the new ticket appears immediately.

**Support workspace.** Status and page are URL-backed. Staff search, expand, self-assign, draft a response, and change status. A normal support account cannot edit a ticket already assigned to somebody else; admin can. The author profile is linked, and admins may block an abusive account from the ticket context.

**Administration.** Tabs load independently with `Promise.allSettled`, so one failed data source does not disable the entire workspace. Detail modals expose listing/application evidence before a decision. Destructive actions require confirmation or a reason. Products, users, applications, and transactions have appropriate search, filters, and pagination. Categories combine name, Lucide icon, and numeric order; seller filter visibility uses dedicated toggles.

**Informational pages.** About explains the catalog focus and moderation, order-safety, and support principles. Delivery presents shipping and packaging guidance. The footer ties catalog, company, delivery, returns, and contact navigation together. Unknown URLs render a dedicated not-found page with a route back into the application.

## 3. Authentication and profiles

- Registration validates a normalized unique username/email and a 6–72 character password.
- Passwords use bcrypt with 12 rounds.
- Registration is followed by automatic login in the UI.
- JWTs are cookie-only: access tokens expire in one hour and refresh tokens in 80 days.
- Cookie `Secure` and `SameSite` behavior is environment-driven; logout clears both cookies.
- Every account has an internal UUID and searchable public ID such as `#A1B2C3D4E5`.
- Users can edit username/description, upload or remove an avatar, and expose follower/following counts.
- Admin blocks retain a reason and affect business operations.

Avatar uploads accept signature-validated JPEG, PNG, or WebP up to 3 MiB and use either local or Cloudinary storage.

## 4. Catalog, products, discounts, and reviews

The public catalog returns only enabled, approved products. Backend filtering covers search, category, min/max price, selected sellers or “Other,” stock state, arbitrary product attributes, and labels for discounted, new (30 days), highly rated (4+), or popular (10+ ratings) listings. Sorting supports popularity, ascending/descending price, newest, and random. Generic offset pagination accepts 1–100 rows; the catalog UI requests 32.

Product pages provide image selection, base/current price, discount badge, stock and quantity selection, ratings, seller/category, structured description, attributes, cart/favorite controls, delivery/warranty panels, review threads, and related products. Discounts range from 0–100%, may expire, and produce a two-decimal computed price.

Seller descriptions use Overview, Use case, Compatibility, Package includes, and Characteristics sections. Brand and Warranty attributes are mandatory; category-aware options and custom filter requests are supported.

An authenticated user may create one rated review per product (1–5) and any user may add a text reply through authenticated API. Rating aggregates update incrementally. Replies carry no rating, do not change the aggregate, and cannot be nested below one reply level. Reviews survive account deletion with a nullable author.

## 5. Cart, favorites, checkout, and orders

Each authenticated user has one cart. The service verifies approved/enabled status and stock, supports add/increment, quantity changes, item removal and clearing. UI quantity updates are debounced by 600 ms.

Cart checkout creates a pending order and clears the cart; it does not charge or decrement inventory yet. Each line snapshots the active discounted price. A **10% platform fee** and seller net amount are stored per line and in order totals. Inventory is locked/rechecked and decremented only when payment succeeds.

Favorites support pagination, add/remove, moving one item to the cart, and a UI bulk move that leaves unavailable/maxed items saved.

Guest cart/favorites exist only in current React memory: they are not persisted to local storage and are not merged into the account after login.

Orders track independent order, payment, delivery, and return statuses. Users get paid/unpaid tabs, progress, line items, payment/delivery metadata, and deletion of pending unpaid orders. Payment states are `pending`, `paid`, `refunded`, `failed`; delivery states are `preparing`, `in_transit`, `delivered`, `delayed`; return states are `none`, `requested`, `approved`, `rejected`, `refunded`.

## 6. Stripe, delivery, and returns

The main payment flow selects an unpaid order and creates a Stripe Checkout Session. Backend supplies immutable line data, order metadata, configured currency, optional automatic tax and allowed shipping countries. Stripe collects cardholder/shipping data and optional NIF. Redirect confirmation and a signed webhook both use idempotent payment finalization, save transaction/session ID, payment method, address and generated payment document, then decrement stock.

A manual payment-recording endpoint also exists, although the current UI uses Stripe.

Users may request a return for their own paid order with a 10–400 character reason. Admin approval creates an idempotent Stripe refund and then updates refund/return/order states in the database. Admin can also update delivery state and tracking number.

The delivery page’s 3–5 day shipping, protected packaging, and pickup pricing are static product copy, not a carrier-rate integration.

## 7. Seller onboarding, stores, and listing moderation

A signed-in user submits one seller application containing an 8–10 character passport ID, full name, unique phone, country, message, and private proof document. PDF/JPEG/PNG documents are content-signature checked, limited to 10 MiB, and stored privately. States are pending, approved, and rejected. Rejected applications expose the reason and can be corrected and resubmitted with a replacement document.

Admin can filter applications, open protected documents, approve atomically (grant seller role, create store, notify user), or reject with a reason of at least 10 characters.

Each seller owns one store with editable name and description. Listing lifecycle is `draft → pending → approved`, plus `rejected`, `blocked`, and `deleted` states. Sellers create structured drafts, upload JPEG/PNG/WebP images up to 8 MiB, edit draft/rejected listings, submit for moderation, toggle approved availability, and delete unpublished listings with a reason. Zero-stock listings cannot be enabled. Rejected edits return to draft.

Admin approves, rejects, blocks, or soft-deletes listings while preserving order history. Seller notifications report moderation outcomes. A separate `show_in_filters` flag controls named seller filter options; all remaining stores fall under “Other.”

## 8. Social graph, chat, and notifications

Public profiles include identity, roles, description, join date, follow counts, and seller store/products. Users can be found by username or public ID, with exact public-ID lookup and separate friend search.

Follows are one-way. Self-follow, duplicates, and blocked targets are rejected. Follow/unfollow is limited to six actions per account pair per hour and emits rate-limited/grouped notifications.

Friendship starts with a request and optional 500-character message. Recipients see pending requests and a counter, then accept or decline. Acceptance creates symmetrical friend rows and a notification. Existing friends can be removed.

Friends can chat through REST history/send endpoints and WebSocket real-time delivery. Messages are 1–15,000 characters and rate-limited to one per second. The composer displays the current character count, highlights overflow, and shows a toast when an oversized send is attempted. Thread lists include last-message previews; URLs in messages are linkified by the UI.

Production WebSockets use a 60-second signed ticket acquired through authenticated HTTP, then connect directly to `VITE_WS_URL`; local Vite proxy supports WebSocket upgrade. Multiple active connections per user receive events.

Notifications store title, message, link, read time, group key, and occurrence count. Equal keys merge inside a five-minute window. Users can paginate, open, mark one/all read, delete all, and see live navigation counters.

## 9. Support and administration

Support tickets have a 150-character subject, up to 2000 characters of detail, and account/order/payment/return/seller/technical/other types. States are open, in progress, resolved, and closed. Users see paginated history and responses.

Support/admin staff filter and search tickets, inspect users, assign a ticket, respond, and change status. Normal support agents may work only on tickets assigned to them; admins have broader access. Assignment and replies notify the customer, and resolution timestamps are maintained. Admin can block a related user with a reason.

The admin panel provides:

1. pending product moderation;
2. all-product block/delete controls;
3. payment-status-filtered transactions with fees, Stripe data, delivery and return details;
4. seller application/document review;
5. paginated user search and blocking;
6. category create/edit/order/icon/delete;
7. named seller-filter visibility.

Category mutation requires both admin authentication and a separate `X-Category-Secret`, requested by a modal in the UI.

## 10. Data model and architecture

Core tables are users/roles/user_roles, stores/seller_requests, categories/products/product_images/reviews, carts/cart_items/favorites, orders/order_items, follows/follow_events/friends/friend_requests/chat_messages, notifications, and support_tickets. Foreign keys use cascading deletion, nullable preservation, or product soft deletion according to historical requirements. Alembic migrations cover the complete evolution through discounts, attributes, social features, support, Stripe, delivery, returns, fee accounting, and safe product deletion.

```text
React/Vite SPA → Axios REST + WebSocket → FastAPI routers
                                      → dependency auth/roles
                                      → transactional services
                                      → Pydantic DTOs + async SQLAlchemy
                                      → PostgreSQL / Cloudinary or local files / Stripe
```

Routers define transport contracts, dependencies enforce authentication and roles, services hold business rules and transaction handling, schemas validate API data, and ORM models map PostgreSQL. File storage is abstracted across local and Cloudinary backends with separate public/private policies.

## 11. Stack, configuration, and deployment

- Frontend: React 19, React Router 7, Vite 8, Tailwind CSS 4, Axios, TanStack Query, Ant Design, Lucide.
- Backend: Python 3.12, FastAPI, Pydantic 2, async SQLAlchemy 2/asyncpg, Alembic, AuthX, bcrypt, Uvicorn.
- Services: PostgreSQL 16, Cloudinary, Stripe Checkout/Webhooks, Docker Compose, Vercel-compatible SPA and Render-compatible backend.

Copy both `.env.example` files to `.env`, configure them, then run:

```powershell
docker compose up --build
```

Frontend is exposed at `localhost:5173`, backend at `localhost:8000`, OpenAPI at `/docs`, and health at `/health`. Compose waits for PostgreSQL, retries migrations up to five times, and starts Uvicorn. Startup ensures required roles and optionally seeds staff/catalog data with timeouts.

Backend configuration covers database pooling, JWT cookies, CORS, local/Cloudinary files, Stripe currency/tax/countries, seeds, and category secret. Frontend uses `VITE_API_URL`, local proxy target, and production `VITE_WS_URL`. All `VITE_*` values are public build-time values and must not contain secrets.

## 12. Security notes and current limitations

Implemented controls include role dependencies, bcrypt, CSRF-protected cookie JWTs, upload signature/size policies, private seller documents, ORM query binding, transactional inventory checks, Stripe webhook verification and refunds, category dual authorization, social/chat throttling, public-ID validation, and constrained CORS.

Production review items:

- No unit, integration, or end-to-end test suite exists, although pytest is installed.
- Guest shopping state is ephemeral and has no login merge.
- Delivery and return pages do not represent carrier or RMA integrations.
- Frontend protected routes generally check authentication, while backend correctly performs final role enforcement; role-specific UI guards could improve UX.
- Demo catalog seed contains fixed seller credentials and is rejected by configuration when `ENV=production`.

## 13. Verification commands

```powershell
cd backend
..\.venv\Scripts\python.exe -m alembic upgrade head

cd ..\frontend
npm.cmd run lint
npm.cmd run build
```

FastAPI’s `/docs` exposes the complete interactive REST contract. The project currently has no dedicated backend lint/type-check command.

## 14. Complete API inventory

All paths below are relative to the backend origin. `Auth` means any signed-in user; seller/support/admin requirements are stated explicitly. Pagination endpoints use `limit` and `offset` unless noted.

| Method and path | Purpose / permission |
|---|---|
| `GET /health` | Health probe |
| `POST /auths/register` | Create account |
| `POST /auths/login` | Set access and refresh cookies |
| `POST /auths/refresh` | Refresh access cookie |
| `GET /auths/me` | Current account (Auth) |
| `POST /auths/logout` | Clear authentication cookies |
| `GET /categories` | Public ordered categories |
| `POST /admin/categories` | Create category (admin + category secret) |
| `PATCH /admin/categories/{id}` | Edit category (admin + secret) |
| `DELETE /admin/categories/{id}` | Delete category (admin + secret) |
| `GET /products` | Public filtered catalog |
| `GET /products/{id}` | Public product details |
| `POST /products/{id}/reviews` | Create rated review (Auth) |
| `POST /products/{id}/reviews/{reviewId}/replies` | Reply to review (Auth) |
| `POST /seller/products` | Create draft (seller) |
| `GET /seller/products` | Seller’s paginated listings |
| `GET /seller/products/{id}` | Seller’s listing details |
| `PATCH /seller/products/{id}` | Edit draft/rejected listing |
| `POST /seller/products/{id}/submit` | Submit for moderation |
| `PATCH /seller/products/{id}/availability` | Toggle approved listing |
| `DELETE /seller/products/{id}` | Delete unpublished listing with reason |
| `POST /seller/products/{id}/images` | Upload product image |
| `DELETE /seller/products/{id}/images/{imageId}` | Delete product image |
| `GET /admin/products` | All products (admin) |
| `GET /admin/products/moderation` | Pending queue (admin) |
| `PATCH /admin/products/moderation/{id}/approve` | Approve listing |
| `PATCH /admin/products/moderation/{id}/reject` | Reject listing with reason |
| `PATCH /admin/products/{id}/block` | Block listing with reason |
| `DELETE /admin/products/{id}` | Soft-delete listing with reason |
| `GET /stores/filter-options` | Public featured seller filters |
| `GET /stores/admin/filter-options` | All seller filters (admin) |
| `PATCH /stores/admin/filter-options/{id}` | Change filter visibility (admin) |
| `GET /stores/me` | Current seller’s store |
| `PATCH /stores/me` | Edit current seller’s store |
| `GET /stores/user/{publicId}` | Public store by owner |
| `GET /stores/user/{publicId}/products` | Public store products |
| `POST /seller-requests` | Submit seller application (Auth, multipart) |
| `GET /seller-requests/me` | Current application |
| `PATCH /seller-requests/me/resubmit` | Resubmit rejected application |
| `GET /admin/seller-requests` | Filtered application list (admin) |
| `GET /admin/seller-requests/{id}/document` | View private proof (admin) |
| `PATCH /admin/seller-requests/{id}/approve` | Approve applicant |
| `PATCH /admin/seller-requests/{id}/reject` | Reject applicant |
| `GET /cart` | Current cart (Auth) |
| `POST /cart/items` | Add item |
| `PATCH /cart/items/{id}` | Set quantity |
| `DELETE /cart/items/{id}` | Remove item |
| `DELETE /cart` | Clear cart |
| `POST /cart/checkout` | Convert cart to pending order |
| `GET /favorites` | Current favorites (Auth) |
| `POST /favorites` | Save product |
| `DELETE /favorites/{id}` | Remove saved item |
| `POST /favorites/{id}/move-to-cart` | Move saved item into cart |
| `GET /orders` | Current user’s orders |
| `DELETE /orders/{id}` | Delete own unpaid order |
| `POST /orders/{id}/pay` | Record manual payment |
| `POST /orders/{id}/stripe-checkout` | Create Stripe Checkout Session |
| `POST /orders/stripe/confirm?session_id=...` | Confirm current user’s Stripe Session |
| `POST /orders/stripe/webhook` | Stripe-signed event receiver |
| `POST /orders/{id}/returns` | Request return |
| `GET /orders/admin/transactions` | Filtered transaction list (admin) |
| `PATCH /orders/admin/{id}/delivery` | Update delivery/tracking (admin) |
| `PATCH /orders/admin/{id}/returns/approve` | Approve return (admin) |
| `GET /users` | Public paginated user list/search |
| `GET /users/search?public_id=...` | Exact public-ID lookup |
| `GET /users/{publicId}` | Public profile |
| `GET /users/me` | Current user |
| `PATCH /users/me` | Edit profile |
| `PATCH /users/me/avatar` | Upload avatar |
| `DELETE /users/me/avatar` | Remove avatar |
| `GET /users/{publicId}/following` | Current user’s follow state |
| `POST /users/{publicId}/follow` | Follow user |
| `DELETE /users/{publicId}/follow` | Unfollow user |
| `GET /users/{publicId}/friendship` | Friendship/request state |
| `POST /users/{publicId}/friend` | Send friend request |
| `DELETE /users/{publicId}/friend` | Remove friend |
| `GET /users/me/friends` | Paginated friend list/search |
| `GET /users/me/friend-requests` | Incoming pending requests |
| `GET /users/me/friend-requests/count` | Pending request count |
| `POST /users/me/friend-requests/{id}/accept` | Accept request |
| `POST /users/me/friend-requests/{id}/decline` | Decline request |
| `GET /users/me/chats` | Chat thread list |
| `GET /users/{publicId}/chat` | Message history |
| `POST /users/{publicId}/chat` | Send REST chat message |
| `POST /users/ws-ticket` | Issue 60-second WebSocket ticket |
| `WS /users/ws/chats?ticket=...` | Real-time chat channel |
| `GET /users/me/notifications` | Paginated notifications |
| `GET /users/me/notifications/unread-count` | Unread counter |
| `PATCH /users/me/notifications/read-all` | Mark all read |
| `PATCH /users/me/notifications/{id}/read` | Mark one read |
| `DELETE /users/me/notifications` | Delete all notifications |
| `PATCH /users/admin/{publicId}/block` | Block user (admin) |
| `PATCH /users/admin/{publicId}/unblock` | Unblock user (admin) |
| `POST /support/tickets` | Create ticket (Auth) |
| `GET /support/tickets/me` | Current user’s tickets |
| `GET /support/tickets` | Search/filter all tickets (support/admin) |
| `PATCH /support/tickets/{id}/assign` | Assign ticket to current staff member |
| `PATCH /support/tickets/{id}` | Respond/change status (assigned support/admin) |
