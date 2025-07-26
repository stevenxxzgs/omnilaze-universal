import { StepContent } from '../types';

export const STEP_CONTENT: StepContent[] = [
  {
    message: "你想在哪里收到你的外卖？",
    showAddressInput: true, 
    inputType: "address"
  },
  {
    message: "你想要吃饭还是喝奶茶？",
    showFoodTypeInput: true,
    inputType: "foodType"
  },
  {
    message: "你有什么忌口？",
    showAllergyInput: true,
    inputType: "allergy"
  },
  {
    message: "你有什么口味偏好？",
    showPreferenceInput: true,
    inputType: "preference"
  },
  {
    message: "我可以花多少钱帮你点外卖？",
    showBudgetInput: true,
    inputType: "budget"
  },
  {
    message: "请扫码支付订单金额并确认下单",
    showPayment: true,
    inputType: "payment"
  }
];