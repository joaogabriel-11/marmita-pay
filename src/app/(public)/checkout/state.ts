export type CheckoutActionState =
  | {
      success: false;
      message: string | null;
    }
  | {
      success: true;
      codigoPedido: number;
    };

export const checkoutInitialState: CheckoutActionState = {
  success: false,
  message: null,
};
