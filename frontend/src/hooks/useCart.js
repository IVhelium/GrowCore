import { useEffect, useMemo, useRef, useState } from "react";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../api/cartApi";
import { showToast } from "../utils/showToast";
import { useAuth } from "./useAuth";

const EMPTY_CART = [];
const QUANTITY_UPDATE_DELAY_MS = 600;

export function useCart(initialItems = EMPTY_CART) {
  const [cart, setCart] = useState(initialItems);
  const [cartError, setCartError] = useState(null);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const quantityUpdateTimers = useRef({});
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const timers = quantityUpdateTimers.current;

    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

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

  async function addToCart(product, quantity = 1) {
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    if (isAuthenticated) {
      try {
        const updatedCart = await addCartItem(product.id, safeQuantity);
        setCart(updatedCart.items);
        setCartError(null);
        showToast("Added to cart", "success");
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
            ? { ...item, quantity: item.quantity + safeQuantity }
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
          quantity: safeQuantity,
          image: product.image,
        },
      ];
    });
    showToast("Added to cart", "success");
  }

  async function changeCartQuantity(item, quantity) {
    setCart((currentCart) =>
      currentCart.map((cartItem) =>
        cartItem.id === item.id ? { ...cartItem, quantity } : cartItem,
      ),
    );

    if (!isAuthenticated) {
      return;
    }

    if (quantityUpdateTimers.current[item.id]) {
      clearTimeout(quantityUpdateTimers.current[item.id]);
    }

    quantityUpdateTimers.current[item.id] = setTimeout(async () => {
      try {
        const updatedCart = await updateCartItem(item.id, quantity);
        setCart(updatedCart.items);
        setCartError(null);
      } catch (error) {
        setCartError(error);
      } finally {
        delete quantityUpdateTimers.current[item.id];
      }
    }, QUANTITY_UPDATE_DELAY_MS);
  }

  async function removeFromCart(item) {
    if (quantityUpdateTimers.current[item.id]) {
      clearTimeout(quantityUpdateTimers.current[item.id]);
      delete quantityUpdateTimers.current[item.id];
    }

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
  };
}
