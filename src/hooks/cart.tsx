import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(
        '@GoMarket:cartProducts',
      );

      if (storageProducts) {
        setProducts([...JSON.parse(storageProducts)]);
      }
    }

    loadProducts();
  }, [products]);

  const addToCart = useCallback(
    async (product: Product) => {
      const existingProductCart = products.findIndex(
        item => item.id === product.id,
      );

      if (existingProductCart >= 0) {
        const addQuantity = {
          id: product.id,
          title: product.title,
          image_url: product.image_url,
          price: product.price,
          quantity: 1 + products[existingProductCart].quantity,
        };
        products.splice(existingProductCart, 1, addQuantity);

        await AsyncStorage.setItem(
          '@GoMarket:cartProducts',
          JSON.stringify(products),
        );
      } else {
        const productCart = {
          id: product.id,
          title: product.title,
          image_url: product.image_url,
          price: product.price,
          quantity: 1,
        };

        const newCart = [...products, productCart];

        setProducts(newCart);

        await AsyncStorage.setItem(
          '@GoMarket:cartProducts',
          JSON.stringify(newCart),
        );
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);

      if (productIndex >= 0) {
        const product = products[productIndex];

        const addQuantity = {
          id: product.id,
          title: product.title,
          image_url: product.image_url,
          price: product.price,
          quantity: 1 + products[productIndex].quantity,
        };
        products.splice(productIndex, 1, addQuantity);

        await AsyncStorage.setItem(
          '@GoMarket:cartProducts',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);

      if (productIndex >= 0) {
        const product = products[productIndex];

        if (product.quantity === 1) {
          products.splice(productIndex, 1);
        } else {
          const addQuantity = {
            id: product.id,
            title: product.title,
            image_url: product.image_url,
            price: product.price,
            quantity: products[productIndex].quantity - 1,
          };
          products.splice(productIndex, 1, addQuantity);
        }

        await AsyncStorage.setItem(
          '@GoMarket:cartProducts',
          JSON.stringify(products),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
