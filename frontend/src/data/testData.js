export const logoText = "GrowCore";

export const categories = [
  "Для девочек",
  "Для мальчиков",
  "Для новорожденных",
  "Канцелярия",
  "Аксессуары",
  "Спорт",
  "Настольные игры",
  "Коляски",
  "Развитие",
  "Конструкторы",
  "Хиты",
  "Новинки",
  "Акции",
  "Популярное",
];

export const categoryCards = [
  { id: 1, title: "Для девочек", icon: "🎀", count: 24 },
  { id: 2, title: "Для мальчиков", icon: "🚀", count: 31 },
  { id: 3, title: "Для новорожденных", icon: "🧸", count: 18 },
  { id: 4, title: "Канцелярия", icon: "✏️", count: 42 },
  { id: 5, title: "Аксессуары", icon: "🎒", count: 16 },
  { id: 6, title: "Спорт", icon: "⚽", count: 21 },
  { id: 7, title: "Настольные игры", icon: "🎲", count: 27 },
  { id: 8, title: "Коляски", icon: "🛒", count: 9 },
];

export const products = [
  {
    id: 1,
    title: "Тор",
    description: "Фигурка героя для сюжетных игр.",
    price: 6600,
    oldPrice: null,
    label: "Хит",
    image:
      "https://static.insales-cdn.com/images/products/1/3727/618745487/card__9_.png",
    rating: 4.8,
  },
  {
    id: 2,
    title: "Медвежонок",
    description: "Мягкая игрушка для самых маленьких.",
    price: 990,
    oldPrice: null,
    label: "Новинка",
    image:
      "https://static.insales-cdn.com/images/products/1/5100/618755052/card__50_.png",
    rating: 4.7,
  },
  {
    id: 3,
    title: "Динозавр",
    description: "Яркая игрушка для детской комнаты.",
    price: 1990,
    oldPrice: null,
    label: "Хит",
    image:
      "https://static.insales-cdn.com/images/products/1/5100/618755052/card__50_.png",
    rating: 4.9,
  },
  {
    id: 4,
    title: "Автокресло",
    description: "Растущее детское автокресло.",
    price: 10850,
    oldPrice: 12500,
    label: "Акция",
    image:
      "https://static.insales-cdn.com/images/products/1/3833/618753785/card__43_.png",
    rating: 4.6,
  },
  {
    id: 5,
    title: "Коляска",
    description: "Удобная прогулочная модель.",
    price: 20800,
    oldPrice: 22000,
    label: "Акция",
    image:
      "https://static.insales-cdn.com/images/products/1/3833/618753785/card__43_.png",
    rating: 4.8,
  },
  {
    id: 6,
    title: "Домино",
    description: "Настольная игра в деревянной коробке.",
    price: 1180,
    oldPrice: 1500,
    label: "Новинка",
    image:
      "https://static.insales-cdn.com/images/products/1/5100/618755052/card__50_.png",
    rating: 4.5,
  },
  {
    id: 7,
    title: "Набор для рисования",
    description: "Канцелярский набор для творчества.",
    price: 1450,
    oldPrice: null,
    label: "Популярное",
    image:
      "https://static.insales-cdn.com/images/products/1/3727/618745487/card__9_.png",
    rating: 4.4,
  },
  {
    id: 8,
    title: "Конструктор",
    description: "Набор деталей для развития моторики.",
    price: 3200,
    oldPrice: 3900,
    label: "Акция",
    image:
      "https://static.insales-cdn.com/images/products/1/5100/618755052/card__50_.png",
    rating: 4.9,
  },
];

export const benefits = [
  {
    id: 1,
    title: "Быстрая доставка",
    description: "Доставка заказов каждый день с 8:00 до 23:00.",
  },
  {
    id: 2,
    title: "Акции и бонусы",
    description: "Сезонные скидки, бонусы и персональные предложения.",
  },
  {
    id: 3,
    title: "Шоурум в центре",
    description: "Можно посмотреть товары перед покупкой.",
  },
];

export const partners = ["KIDS", "TOYS", "BABY", "PLAY", "JOY", "MOM"];

export const demoUser = {
  id: 1,
  firstName: "Максим",
  email: "maksim@example.com",
  phone: "+7 (800) 800-80-80",
};

export const demoOrders = [
  { id: 101, status: "В обработке", total: 7590, date: "20.05.2026" },
  { id: 100, status: "Доставлен", total: 12990, date: "12.05.2026" },
];

export const demoCartItems = [
  {
    id: 1,
    productId: 1,
    title: "Тор",
    price: 6600,
    quantity: 1,
    image:
      "https://static.insales-cdn.com/images/products/1/3727/618745487/card__9_.png",
  },
  {
    id: 2,
    productId: 2,
    title: "Медвежонок",
    price: 990,
    quantity: 2,
    image:
      "https://static.insales-cdn.com/images/products/1/5100/618755052/card__50_.png",
  },
];