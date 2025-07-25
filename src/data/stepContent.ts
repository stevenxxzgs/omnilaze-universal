import { StepContent } from '../types';

export const STEP_CONTENT: StepContent[] = [
  {
    message: "你的手机号码是多少？",
    showPhoneInput: true,
    inputType: "phone"
  },
  {
    message: "你想在哪里收到你的外卖？",
    showAddressInput: true,
    inputType: "address"
  },
  {
    message: "我可以花多少钱帮你点外卖？",
    showBudgetInput: true,
    inputType: "budget"
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
    message: "太棒了！正在为您推荐最合适的外卖...",
    showCompleted: true,
    inputType: "completed"
  }
];