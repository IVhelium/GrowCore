import { useEffect, useMemo, useState } from "react";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItems,
} from "../api/cartApi";
import { useAuth } from "./useAuth";

const EMPTY_CART = [];

export function useCart(initialItems = EMPTY_CART) {
  const [cart, setCart] = useState(initialItems);
  const [cartError, setCartError] = useState(null);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let isActive = true;

    async function loadCart() {
      if (!isAuthenticated) {
        setCart(initialItems);
        setCartError(null);
        setIsCartLoading(false);
        return;
      }

      setIsCartLoading(true);
      setCartError(null);

      try {
        const currentCart = await getCart();

        if (isActive) {
          setCart(currentCart.items);
        }
      } catch (error) {
        if (isActive) {
          setCartError(error);
          setCart([]);
        }
      } finally {
        if (isActive) {
          setIsCartLoading(false);
        }
      }
    }

    loadCart();

    return () => {
      isActive = false;
    };
  }, [initialItems, isAuthenticated]);

  async function addToCart(product) {
    if (isAuthenticated) {
      try {
        const updatedCart = await addCartItem(product.id, 1);
        setCart(updatedCart.items);
        setCartError(null);
        return updatedCart;
      } catch (error) {
        setCartError(error);
        return null;
      }
    }

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

  async function changeCartQuantity(item, quantity) {
    setCart((currentCart) =>
      currentCart.map((cartItem) =>
        cartItem.id === item.id ? { ...cartItem, quantity } : cartItem,
      ),
    );
  }

  async function syncCartQuantities() {
    if (!isAuthenticated) {
      return { items: cart };
    }

    try {
      const updatedCart = await updateCartItems(cart);
      setCart(updatedCart.items);
      setCartError(null);
      return updatedCart;
    } catch (error) {
      setCartError(error);
      return null;
    }
  }

  async function removeFromCart(item) {
    if (isAuthenticated) {
      try {
        const updatedCart = await removeCartItem(item.id);
        setCart(updatedCart.items);
        setCartError(null);
        return updatedCart;
      } catch (error) {
        setCartError(error);
        return null;
      }
    }

    setCart((currentCart) =>
      currentCart.filter((cartItem) => cartItem.id !== item.id),
    );
  }

  function replaceCart(updatedCart) {
    if (!updatedCart) {
      return;
    }

    setCart(updatedCart.items || []);
    setCartError(null);
  }

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  return {
    cart,
    cartCount,
    cartError,
    isCartLoading,
    addToCart,
    changeCartQuantity,
    removeFromCart,
    replaceCart,
    syncCartQuantities,
  };
}
