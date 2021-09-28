import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      localStorage.removeItem("@RocketShoes:cart");
      const findProduct = cart.find((product) => product.id === productId);

      if (!!findProduct) {
        const productStock = await api.get(`stock/${productId}`);

        if (productStock.data.amount <= findProduct.amount) {
          toast.error("Quantidade solicitada fora de estoque");

          return;
        }
        findProduct.amount++;

        const newArray = cart.map((product) => {
          if (product.id === productId) {
            return findProduct;
          }
          return product;
        });

        setCart(newArray);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));

        return;
      }

      const product = await api.get(`products/${productId}`);

      const newArray = [
        ...cart,
        {
          id: product.data.id,
          image: product.data.image,
          price: product.data.price,
          title: product.data.title,
          amount: 1,
        },
      ];

      setCart(newArray);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newArray));

      return;
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const findProduct = cart.find((product) => product.id === productId);

      if (!findProduct) {
        toast.error("Erro na remoção do produto");

        return;
      }
      const newArray = cart.filter((product) => productId !== product.id);

      setCart(newArray);

      localStorage.removeItem("@RocketShoes:cart");
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newArray));

      return;
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const findProduct = cart.find((product) => product.id === productId);
      const productStock = await api.get(`stock/${productId}`);

      if (!findProduct) {
        return;
      }

      if (productStock.data.amount < amount) {
        toast.error("Quantidade solicitada fora de estoque");

        return;
      }

      if (amount < 1) {
        toast.error("Quantidade solicitada fora de estoque");

        return;
      }

      findProduct.amount = amount;

      const newArray = cart.map((product) => {
        if (product.id === productId) {
          return findProduct;
        }
        return product;
      });

      setCart(newArray);

      localStorage.removeItem("@RocketShoes:cart");
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newArray));

      return;
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
