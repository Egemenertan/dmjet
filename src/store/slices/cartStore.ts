/**
 * Cart Store
 * Shopping cart state management with persistence
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Maximum quantity per product for security
export const MAX_QUANTITY_PER_PRODUCT = 10;

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  discount?: number;
  barcode?: number | null;
  category_id?: string | null;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  couponCode: string | null;
  couponDiscount: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
}

const calculateTotal = (items: CartItem[], couponDiscount: number) => {
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = item.discount
      ? item.price * (1 - item.discount / 100)
      : item.price;
    return sum + itemPrice * item.quantity;
  }, 0);
  return Math.max(0, subtotal - couponDiscount);
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalAmount: 0,
      couponCode: null,
      couponDiscount: 0,
      
      addItem: (newItem) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.id === newItem.id);
          let updatedItems: CartItem[];

          if (existingItem) {
            // Check if adding one more would exceed the limit
            if (existingItem.quantity >= MAX_QUANTITY_PER_PRODUCT) {
              // Don't update, just return current state
              // Alert will be shown in the component
              return state;
            }
            
            updatedItems = state.items.map((item) =>
              item.id === newItem.id
                ? {...item, quantity: Math.min(item.quantity + 1, MAX_QUANTITY_PER_PRODUCT)}
                : item
            );
          } else {
            updatedItems = [...state.items, {...newItem, quantity: 1}];
          }

          return {
            items: updatedItems,
            totalAmount: calculateTotal(updatedItems, state.couponDiscount),
          };
        }),

      removeItem: (itemId) =>
        set((state) => {
          const updatedItems = state.items.filter((item) => item.id !== itemId);
          return {
            items: updatedItems,
            totalAmount: calculateTotal(updatedItems, state.couponDiscount),
          };
        }),

      updateQuantity: (itemId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return get().removeItem(itemId), state;
          }

          // Enforce maximum quantity limit
          const limitedQuantity = Math.min(quantity, MAX_QUANTITY_PER_PRODUCT);

          const updatedItems = state.items.map((item) =>
            item.id === itemId ? {...item, quantity: limitedQuantity} : item
          );

          return {
            items: updatedItems,
            totalAmount: calculateTotal(updatedItems, state.couponDiscount),
          };
        }),

      clearCart: () =>
        set({
          items: [],
          totalAmount: 0,
          couponCode: null,
          couponDiscount: 0,
        }),

      applyCoupon: (code, discount) =>
        set((state) => ({
          couponCode: code,
          couponDiscount: discount,
          totalAmount: calculateTotal(state.items, discount),
        })),

      removeCoupon: () =>
        set((state) => ({
          couponCode: null,
          couponDiscount: 0,
          totalAmount: calculateTotal(state.items, 0),
        })),
    }),
    {
      name: 'cart-storage', // AsyncStorage'da kullanılacak key
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

