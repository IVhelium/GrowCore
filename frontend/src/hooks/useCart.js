import { useMemo, useState } from "react";

export function useCart(initialItems = []) {
  const [cart, setCart] = useState(initialItems);

  function addToCart(product) {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.productId === product.id,
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          id: product.id,
          productId: product.id,
          title: product.title,
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ];
    });
  }

  function changeCartQuantity(item, quantity) {
    setCart((currentCart) =>
      currentCart.map((cartItem) =>
        cartItem.id === item.id ? { ...cartItem, quantity } : cartItem,
      ),
    );
  }

  function removeFromCart(item) {
    setCart((currentCart) =>
      currentCart.filter((cartItem) => cartItem.id !== item.id),
    );
  }

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  return {
    cart,
    cartCount,
    addToCart,
    changeCartQuantity,
    removeFromCart,
  };
}
